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
router.post("/create-order", authMiddleware, authorize("student"), controller.createOrder);
router.post("/verify", authMiddleware, authorize("student"), controller.verifyPayment);

// ✅ NEW ROUTES
router.post("/activate-free", authMiddleware, authorize("student"), controller.activateFreeSubscription);
router.get("/subscription", authMiddleware, authorize("student"), controller.getSubscription);

// Per-topic test-series unlock via Razorpay (one-time per topic)
router.post("/topic/:topicId/order", authMiddleware, authorize("student"), controller.createTopicOrder);
router.post("/topic/:topicId/verify", authMiddleware, authorize("student"), controller.verifyTopicPayment);
router.get("/topic/:topicId/access", authMiddleware, authorize("student"), controller.checkTopicAccess);

// Admin routes — payment approval
router.get("/pending-approval", authMiddleware, authorize("admin"), controller.getPendingApprovalPayments);
router.put("/:id/approve", authMiddleware, authorize("admin"), controller.approvePayment);
router.put("/:id/reject", authMiddleware, authorize("admin"), controller.rejectPayment);

export default router;


