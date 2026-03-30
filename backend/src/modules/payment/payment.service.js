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

// TEMPORARY CLEANUP: Run this once, then you can delete it.
mongoose.connection.on('open', async () => {
  try {
    const collection = mongoose.connection.db.collection('subscriptions');
    // This removes the index that is causing the "studentId: null" error
    await collection.dropIndex('studentId_1');
    console.log("Successfully dropped the ghost index: studentId_1");
  } catch (err) {
    console.log("Index studentId_1 not found or already deleted. Skipping.");
  }
});

const getPlanDurationInDays = (plan) => {
  if (plan === "YEARLY") return 365;
  if (plan === "QUARTERLY") return 90;
  return 30;
};

// payment.service.js
const activatePaidSubscription = async (payment) => {
  const durationInDays = getPlanDurationInDays(payment.plan);
  const now = new Date();
  
  // CRITICAL: Ensure we use the userId from the payment record
  const userId = payment.userId;

  const currentSubscription = await Subscription.findOne({ userId });

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

  // Use findOneAndUpdate with upsert to prevent duplicate subscription docs
  return await Subscription.findOneAndUpdate(
    { userId: userId }, 
    {
      $set: {
        plan: payment.plan,
        status: "ACTIVE",
        price: payment.amount,
        currency: payment.currency || "INR",
        startDate: currentSubscription?.plan === payment.plan ? (currentSubscription.startDate || now) : now,
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
    { upsert: true, new: true, runValidators: true }
  );
};
// payment.service.js
export const userHasPaidSubscription = async (userId) => {
  try {
    const sub = await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "ACTIVE",
      plan: { $ne: "FREE" },
      endDate: { $gt: new Date() },
    }).lean();

    if (!sub) return false;

    // Extra security: verify the underlying payment was admin-approved
    const approvedPayment = await Payment.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      plan: sub.plan,
      status: "SUCCESS",
      adminApproved: true,
    }).lean();

    return !!approvedPayment;
  } catch (error) {
    console.error("Error checking paid subscription:", error);
    return false;
  }
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
  // 1. Find the payment record
  const payment = await Payment.findOne({ orderId: razorpay_order_id });

  if (!payment) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Payment order not found.");
  }

  // 2. Prevent duplicate processing
  if (["SUCCESS", "APPROVED"].includes(payment.status)) {
    return { alreadyProcessed: true };
  }

  // 3. Security Check
  if (payment.userId.toString() !== userId.toString()) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized verification attempt.");
  }

  // 4. Handle DEV Mode
  if (process.env.PAYMENT_MODE === "DEV") {
    payment.paymentId = razorpay_payment_id || `DEV_PAY_${Date.now()}`;
    payment.status = "SUCCESS";
    payment.adminApproved = true;
    payment.verifiedAt = new Date();
    payment.approvedAt = new Date();
    
    try {
      await payment.save();
      await activatePaidSubscription(payment);
      return { success: true, dev: true, message: "Dev Payment Success" };
    } catch (dbErr) {
      // If you still get E11000 here, it means step 1 (dropping index) wasn't successful
      throw new ApiError(STATUS_CODES.BAD_REQUEST, `DB Error: ${dbErr.message}`);
    }
  }

  // 5. PRODUCTION Logic: Signature Verification
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    payment.status = "FAILED";
    await payment.save();
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid signature.");
  }

  // 6. Update Payment and Activate
  payment.paymentId = razorpay_payment_id;
  payment.status = "SUCCESS";
  payment.adminApproved = true;
  payment.verifiedAt = new Date();
  payment.approvedAt = new Date();

  try {
    await payment.save();
    await activatePaidSubscription(payment);
    return { success: true, message: "Payment verified and activated." };
  } catch (saveErr) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Subscription Error: ${saveErr.message}`);
  }
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
// payment.service.js
export const activateFreeSubscription = async (userId) => {
  const objUserId = new mongoose.Types.ObjectId(userId);

  try {
    // Check if user already has an active subscription
    const existingSub = await Subscription.findOne({
      userId: objUserId,
      status: "ACTIVE",
    });

    if (existingSub) {
      // If they have an active subscription, just return it
      return existingSub;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100);

    // Use findOneAndUpdate with upsert
    const subscription = await Subscription.findOneAndUpdate(
      { userId: objUserId },
      {
        $setOnInsert: {
          userId: objUserId,
          startDate,
        },
        $set: {
          plan: "FREE",
          status: "ACTIVE",
          price: 0,
          endDate,
          billingCycle: "ONE_TIME",
        },
        $push: {
          paymentHistory: {
            paymentId: `FREE_${Date.now()}`,
            amount: 0,
            paidAt: startDate,
            plan: "FREE",
          },
        },
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    return subscription;
  } catch (error) {
    console.error("Error activating free subscription:", error);
    
    // Handle race condition - if duplicate key, fetch existing
    if (error.code === 11000) {
      const existingSub = await Subscription.findOne({ userId: objUserId });
      if (existingSub) {
        return existingSub;
      }
    }
    throw new ApiError(STATUS_CODES.SERVER_ERROR, "Failed to activate free subscription");
  }
};

// payment.service.js
export const getActiveSubscription = async (userId) => {
  try {
    return await Subscription.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: "ACTIVE",
      endDate: { $gt: new Date() },
    }).lean();
  } catch (error) {
    console.error("Error getting active subscription:", error);
    return null;
  }
};