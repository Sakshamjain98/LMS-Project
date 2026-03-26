import * as service from "./payment.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const getPlans = asyncHandler(async (req, res) => {
  const plans = service.getPlans();
  res.status(STATUS_CODES.SUCCESS).json({ success: true, plans });
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await service.createOrder(req.user._id, req.body.planId);
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
    pendingAdminApproval: !result.alreadyProcessed,
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


