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

