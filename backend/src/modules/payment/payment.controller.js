import * as service from "./payment.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const getPlans = asyncHandler(async (req, res) => {
  const plans = service.getPlans();
  
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    plans,
  });
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
  await service.verifyPayment({
    userId: req.user._id,
    ...req.body,
  });

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.PAYMENT_SUCCESS,
  });
});
