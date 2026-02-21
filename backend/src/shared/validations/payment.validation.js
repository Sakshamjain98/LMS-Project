import Joi from "joi";

export const createOrderSchema = Joi.object({
  planId: Joi.string().valid("MONTHLY", "QUARTERLY", "YEARLY").required(),
});

export const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
});
