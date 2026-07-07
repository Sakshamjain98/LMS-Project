import * as service from "./payment.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const getPlans = asyncHandler(async (req, res) => {
  const plans = service.getPlans();
  res.status(STATUS_CODES.SUCCESS).json({ success: true, plans });
});

export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Check for active premium subscription BEFORE creating order
  const isPremium = await service.userHasPaidSubscription(userId);
  
  if (isPremium) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: "You already have an active premium subscription."
    });
  }

  // 2. Only proceed to order creation if not subscribed
  const order = await service.createOrder(userId, req.body.planId);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.PAYMENT_INITIATED,
    order,
  });
});
export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await service.verifyPayment({
    userId: req.user._id,
    ...req.body,
  });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: result.alreadyProcessed
      ? "Payment already processed"
      : MESSAGES.PAYMENT_SUCCESS,
    pendingAdminApproval: false,
    ...result,
  });
});

// ✅ FREE SUBSCRIPTION CONTROLLER
export const activateFreeSubscription = asyncHandler(async (req, res) => {
  const subscription = await service.activateFreeSubscription(req.user._id);
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "FREE subscription activated successfully",
    subscription,
  });
});

// ✅ GET SUBSCRIPTION CONTROLLER
export const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await service.getActiveSubscription(req.user._id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    subscription: subscription || {
      plan: "FREE",
      status: "INACTIVE",
    },
  });
});

// Admin: get all payments awaiting approval
export const getPendingApprovalPayments = asyncHandler(async (req, res) => {
  const payments = await service.getPendingApprovalPayments();
  res.status(STATUS_CODES.SUCCESS).json({ success: true, payments });
});

// Admin: approve a payment and activate subscription
export const approvePayment = asyncHandler(async (req, res) => {
  const payment = await service.approvePaymentAndActivate(req.params.id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Payment approved and subscription activated",
    payment,
  });
});

// Admin: reject a payment
export const rejectPayment = asyncHandler(async (req, res) => {
  const payment = await service.rejectPaymentByAdmin(req.params.id, req.body.reason);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Payment rejected",
    payment,
  });
});

// Per-topic (paid test series) unlock via Razorpay
export const createTopicOrder = asyncHandler(async (req, res) => {
  const order = await service.createTopicOrder(req.user._id, req.params.topicId);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Topic order created",
    order,
  });
});

export const verifyTopicPayment = asyncHandler(async (req, res) => {
  const result = await service.verifyTopicPayment({
    userId: req.user._id,
    topicId: req.params.topicId,
    ...req.body,
  });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: result.alreadyProcessed ? "Already unlocked" : MESSAGES.PAYMENT_SUCCESS,
    ...result,
  });
});

export const checkTopicAccess = asyncHandler(async (req, res) => {
  const unlocked = await service.userHasTopicAccess(req.user._id, req.params.topicId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, unlocked });
});

// Per-course one-time purchase via Razorpay
export const createCourseOrder = asyncHandler(async (req, res) => {
  const order = await service.createCourseOrder(req.user._id, req.params.courseId);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Course order created",
    order,
  });
});

export const verifyCoursePayment = asyncHandler(async (req, res) => {
  const result = await service.verifyCoursePayment({
    userId: req.user._id,
    courseId: req.params.courseId,
    ...req.body,
  });
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: result.alreadyProcessed ? "Already unlocked" : MESSAGES.PAYMENT_SUCCESS,
    ...result,
  });
});

export const checkCourseAccess = asyncHandler(async (req, res) => {
  const unlocked = await service.userHasCourseAccess(req.user._id, req.params.courseId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, unlocked });
});

// Client resume path — re-checks one of the current user's own pending orders
// against Razorpay in case the checkout `handler` callback never fired.
export const checkAndResumeOrder = asyncHandler(async (req, res) => {
  const result = await service.checkAndResumeOrder(req.user._id, req.params.orderId);
  res.status(STATUS_CODES.SUCCESS).json({ success: true, ...result });
});

// Razorpay webhook — server-to-server confirmation that unlocks a paid order even
// when the browser never calls /verify. Mounted with express.raw() in app.js so
// `req.body` is the raw Buffer needed for HMAC verification. Not wrapped in
// asyncHandler because it needs custom status codes for Razorpay's retry logic.
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const result = await service.handleRazorpayWebhook(req.body, signature);
    return res.status(200).json({ received: true, ...result });
  } catch (err) {
    const status = err?.statusCode || 500;
    console.error("Razorpay webhook error:", err?.message);
    // 4xx (e.g. bad signature) → Razorpay won't retry. 5xx → it retries later.
    return res
      .status(status >= 400 && status < 500 ? status : 500)
      .json({ received: false, message: err?.message || "Webhook processing failed" });
  }
};

// Admin recovery for a payment that was taken but never unlocked.
export const reconcilePayment = asyncHandler(async (req, res) => {
  const { paymentId, orderId } = req.body || {};
  const result = await service.reconcilePayment({ paymentId, orderId });
  res.status(STATUS_CODES.SUCCESS).json({ success: true, message: "Payment reconciled", ...result });
});

