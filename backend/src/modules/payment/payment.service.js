import Payment from "../../models/payment.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { paymentQueue } from "../../infrastucture/queues/payment.queue.js";
import { SUBSCRIPTION_PLANS } from "../../constants/subscription.js";

export const getPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS).filter((p) => p.id !== "FREE");
};

export const createOrder = async (userId, planId) => {
  const plan = SUBSCRIPTION_PLANS[planId];
  
  if (!plan || plan.id === "FREE") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid plan selected");
  }

  const orderId = `order_${Date.now()}_${userId}`;

  await Payment.create({
    userId,
    orderId,
    amount: plan.price,
    plan: plan.id,
  });

  return { 
    orderId, 
    amount: plan.price,
    plan: plan.id,
    planName: plan.name,
    duration: plan.duration,
  };
};

export const verifyPayment = async ({
  userId,
  orderId,
  paymentId,
}) => {
  const payment = await Payment.findOne({ orderId });

  if (!payment) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_PAYMENT);
  }

  // IDEMPOTENCY
  if (payment.status === "SUCCESS") {
    return { alreadyProcessed: true };
  }

  payment.paymentId = paymentId;
  payment.status = "SUCCESS";
  await payment.save();

  // Queue subscription grant
  await paymentQueue.add("grant-subscription", {
    userId,
    paymentId,
    plan: payment.plan,
    amount: payment.amount,
  });

  return { success: true };
};
