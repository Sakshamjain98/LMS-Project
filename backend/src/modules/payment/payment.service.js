import Payment from "../../models/payment.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { paymentQueue } from "../../infrastucture/queues/payment.queue.js";
import { SUBSCRIPTION_PLANS } from "../../constants/subscription.js";
import { razorpay } from "../../config/razorpay.js";
import crypto from "crypto";

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

    razorpayOrderData = await razorpay.orders.create({
      amount: plan.price * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${userId}`,
      notes: {
        userId: userId.toString(),
        planId: plan.id,
      },
    });

    orderId = razorpayOrderData.id;
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
    throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_PAYMENT);
  }

  // Prevent duplicate processing
  if (payment.status === "SUCCESS" || payment.status === "PENDING_APPROVAL") {
    return { alreadyProcessed: true };
  }

  if (payment.status === "APPROVED") {
    return { alreadyProcessed: true };
  }

  // Security: ensure the payment belongs to the requesting user
  if (payment.userId.toString() !== userId.toString()) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized payment verification attempt");
  }

  if (process.env.PAYMENT_MODE === "DEV") {
    // DEV MODE BYPASS — skip signature verification
    payment.paymentId = razorpay_payment_id || `DEV_PAY_${Date.now()}`;
    payment.status = "PENDING_APPROVAL";
    payment.adminApproved = false;
    payment.verifiedAt = new Date();
    await payment.save();

    return {
      success: true,
      dev: true,
      message: "Payment verified (DEV mode). Awaiting admin approval before subscription is activated.",
    };
  }

  // PRODUCTION: strict signature verification
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Missing payment verification fields");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(generatedSignature, "hex");
  const receivedSigBuffer = Buffer.from(razorpay_signature, "hex");

  if (
    sigBuffer.length !== receivedSigBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, receivedSigBuffer)
  ) {
    // Mark payment as failed for audit
    payment.status = "FAILED";
    await payment.save();
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid payment signature");
  }

  payment.paymentId = razorpay_payment_id;
  payment.status = "PENDING_APPROVAL";
  payment.adminApproved = false;
  payment.verifiedAt = new Date();
  await payment.save();

  return {
    success: true,
    message: "Payment verified successfully. Awaiting admin approval before subscription is activated.",
  };
};

// Called by admin to approve a verified payment and activate subscription
export const approvePaymentAndActivate = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new ApiError(STATUS_CODES.NOT_FOUND, "Payment not found");

  if (payment.status !== "PENDING_APPROVAL") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Payment is in '${payment.status}' state and cannot be approved`);
  }

  payment.status = "SUCCESS";
  payment.adminApproved = true;
  payment.approvedAt = new Date();
  await payment.save();

  // Queue subscription activation
  await paymentQueue.add("activate-subscription", {
    userId: payment.userId,
    plan: payment.plan,
    paymentId: payment._id,
  });

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