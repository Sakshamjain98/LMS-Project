import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as controller from "./payment.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOrderSchema, verifyPaymentSchema } from "../../shared/validations/payment.validation.js";

const router = express.Router();

// Public
router.get("/plans", controller.getPlans);

// Student routes
router.post("/create-order", authMiddleware, authorize("student"), validate(createOrderSchema), controller.createOrder);
router.post("/verify", authMiddleware, authorize("student"), validate(verifyPaymentSchema), controller.verifyPayment);

// Admin routes — payment approval
router.get("/pending-approval", authMiddleware, authorize("admin"), controller.getPendingApprovalPayments);
router.put("/:id/approve", authMiddleware, authorize("admin"), controller.approvePayment);
router.put("/:id/reject", authMiddleware, authorize("admin"), controller.rejectPayment);

export default router;






