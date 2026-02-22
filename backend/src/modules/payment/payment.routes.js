import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import * as controller from "./payment.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOrderSchema, verifyPaymentSchema } from "../../shared/validations/payment.validation.js";

const router = express.Router();

// Public - get available plans
router.get("/plans", controller.getPlans);

// Protected routes
router.post("/create-order", authMiddleware, validate(createOrderSchema), controller.createOrder);
router.post("/verify", authMiddleware, validate(verifyPaymentSchema), controller.verifyPayment);


export default router;
