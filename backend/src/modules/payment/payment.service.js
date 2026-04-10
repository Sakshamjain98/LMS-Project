import Payment from "../../models/payment.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { paymentQueue } from "../../infrastucture/queues/payment.queue.js";
import { SUBSCRIPTION_PLANS } from "../../constants/subscription.js";
import { razorpay } from "../../config/razorpay.js";
import crypto from "crypto";
import mongoose from "mongoose";
import Subscription from "../../models/subscription.model.js";

const getPlanDurationInDays = (plan) => {
  if (plan === "YEARLY") return 365;
  if (plan === "QUARTERLY") return 90;
  return 30;
};

const activatePaidSubscription = async (payment) => {
  const durationInDays = getPlanDurationInDays(payment.plan);
  const now = new Date();
  const currentSubscription = await Subscription.findOne({ userId: payment.userId });

  let startDate = now;
  if (
    currentSubscription?.status === "ACTIVE" &&
    currentSubscription?.endDate &&
    currentSubscription.endDate > now &&
    currentSubscription.plan !== "FREE"
  ) {
    startDate = currentSubscription.endDate;
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationInDays);

  await Subscription.findOneAndUpdate(
    { userId: payment.userId },
    {
      $set: {
        plan: payment.plan,
        status: "ACTIVE",
        price: payment.amount,
        currency: payment.currency || "INR",
        startDate: currentSubscription?.plan === payment.plan ? currentSubscription.startDate || now : now,
        endDate,
        billingCycle: payment.plan,
      },
      $push: {
        paymentHistory: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          paidAt: payment.approvedAt || payment.verifiedAt || now,
          plan: payment.plan,
        },
      },
    },
    { upsert: true, new: true }
  );
};

export const userHasPaidSubscription = async (userId) => {
  const sub = await Subscription.findOne({
    userId,
    status: "ACTIVE",
    plan: { $ne: "FREE" },
    endDate: { $gt: new Date() },
  }).lean();

  if (!sub) return false;

  const approvedPayment = await Payment.findOne({
    userId,
    plan: sub.plan,
    status: "SUCCESS",
    adminApproved: true,
  }).lean();

  return !!approvedPayment;
};

export const getPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS).filter((p) => p.id !== "FREE");
};

export const createOrder = async (userId, planId) => {
  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan || plan.id === "FREE") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid plan selected");
  }

  let orderId;
  let razorpayOrderData = null;

  if (process.env.PAYMENT_MODE === "DEV") {
    // Dev mode: skip real Razorpay order creation
    orderId = `dev_order_${Date.now()}_${userId}`;
  } else {
    // Production: create real Razorpay order
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(STATUS_CODES.SERVER_ERROR, "Razorpay configuration missing");
    }

    try {
      razorpayOrderData = await razorpay.orders.create({
        amount: Math.round(plan.price * 100), // Ensure it's a strict integer
        currency: "INR",
        receipt: `rcpt_${Date.now().toString().slice(-8)}_${userId.toString().slice(-4)}`, // Keep under 40 chars
        notes: {
          userId: userId.toString(),
          planId: plan.id,
        },
      });
      orderId = razorpayOrderData.id;
    } catch (razorpayError) {
      console.error("Razorpay SDK Error:", razorpayError);
      throw new ApiError(
        STATUS_CODES.SERVER_ERROR,
        razorpayError.error?.description || "Failed to create order with payment gateway"
      );
    }
  }

  await Payment.create({
    userId,
    orderId,
    amount: plan.price,
    plan: plan.id,
    status: "PENDING",
    adminApproved: false,
  });

  return {
    orderId,
    amount: plan.price,
    amountInPaise: plan.price * 100,
    currency: "INR",
    plan: plan.id,
    planName: plan.name,
    duration: plan.duration,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "DEV_KEY",
    ...(razorpayOrderData && { razorpayOrder: razorpayOrderData }),
  };
};

export const verifyPayment = async ({
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const payment = await Payment.findOne({ orderId: razorpay_order_id });

  if (!payment) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Payment order not found in database.");
  }

  // Prevent duplicate processing
  if (payment.status === "SUCCESS" || payment.status === "PENDING_APPROVAL" || payment.status === "APPROVED") {
    return { alreadyProcessed: true };
  }

  // Security
  if (payment.userId.toString() !== userId.toString()) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized payment verification attempt.");
  }

  if (process.env.PAYMENT_MODE === "DEV") {
    payment.paymentId = razorpay_payment_id || `DEV_PAY_${Date.now()}`;
    payment.status = "SUCCESS";
    payment.adminApproved = true;
    payment.verifiedAt = new Date();
    payment.approvedAt = new Date();
    
    try {
      await payment.save();
      await activatePaidSubscription(payment);
    } catch (saveErr) {
      console.error("DEV Verify Save Error:", saveErr);
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `DB Error: ${saveErr.message}`);
    }

    return {
      success: true,
      dev: true,
      subscriptionActivated: true,
      message: "Payment verified and subscription activated.",
    };
  }

  // PRODUCTION: strict signature verification
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Missing one or more payment verification fields from Razorpay.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    payment.status = "FAILED";
    await payment.save();
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid payment signature - authentication failed.");
  }

  payment.paymentId = razorpay_payment_id;
  payment.status = "SUCCESS";
  payment.adminApproved = true;
  payment.verifiedAt = new Date();
  payment.approvedAt = new Date();

  try {
    await payment.save();
    await activatePaidSubscription(payment);
  } catch (saveErr) {
    console.error("PROD Verify Save Error:", saveErr);
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `DB Error: ${saveErr.message}`);
  }

  return {
    success: true,
    subscriptionActivated: true,
    message: "Payment verified successfully and subscription activated.",
  };
};

// Called by admin to approve a verified payment and activate subscription


export const approvePaymentAndActivate = async (paymentId) => {
  // 1. Mark payment as successful and admin-approved
  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { status: "SUCCESS", adminApproved: true, approvedAt: new Date() },
    { new: true }
  );

  if (!payment) throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment not found");

  // 2. Activate the matching subscription in DB
  await activatePaidSubscription(payment);

  return payment;
};

// Called by admin to reject a pending payment
export const rejectPaymentByAdmin = async (paymentId, reason) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment not found");

  if (payment.status !== "PENDING_APPROVAL") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Payment is in '${payment.status}' state and cannot be rejected`);
  }

  payment.status = "REJECTED";
  payment.adminApproved = false;
  payment.rejectionReason = reason || "Rejected by admin";
  payment.rejectedAt = new Date();
  await payment.save();

  return payment;
};

export const getPendingApprovalPayments = async () => {
  return Payment.find({ status: "PENDING_APPROVAL" })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
};

// ✅ ADD FREE SUBSCRIPTION LOGIC
export const activateFreeSubscription = async (userId) => {
  const objUserId = new mongoose.Types.ObjectId(userId);

  const existingSub = await Subscription.findOne({
    userId: objUserId,
    status: "ACTIVE",
  });

  if (existingSub) {
    throw new ApiError(STATUS_CODES.CONFLICT, "You already have an active subscription");
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 100);

  const subscription = await Subscription.findOneAndUpdate(
    { userId: objUserId },
    {
      plan: "FREE",
      status: "ACTIVE",
      price: 0,
      startDate,
      endDate,
      billingCycle: "ONE_TIME",
      paymentHistory: [{
        paymentId: `FREE_${Date.now()}`,
        amount: 0,
        paidAt: startDate,
        plan: "FREE",
      }],
    },
    { upsert: true, new: true }
  );

  return subscription;
};

export const getActiveSubscription = async (userId) => {
  return Subscription.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: "ACTIVE",
    endDate: { $gt: new Date() },
  }).lean();
};
