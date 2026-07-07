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

// Per-course unlock via Razorpay (one-time per course, time-bound)
router.post("/course/:courseId/order", authMiddleware, authorize("student"), controller.createCourseOrder);
router.post("/course/:courseId/verify", authMiddleware, authorize("student"), controller.verifyCoursePayment);
router.get("/course/:courseId/access", authMiddleware, authorize("student"), controller.checkCourseAccess);

// Resume path — client re-checks its own pending order after a lost checkout callback.
router.get("/status/:orderId", authMiddleware, authorize("student"), controller.checkAndResumeOrder);

// Admin routes — payment approval. Superadmin-only: payments are never a
// grantable admin permission (client requirement — admins must not see payments).
router.get("/pending-approval", authMiddleware, authorize("superadmin"), controller.getPendingApprovalPayments);
router.put("/:id/approve", authMiddleware, authorize("superadmin"), controller.approvePayment);
router.put("/:id/reject", authMiddleware, authorize("superadmin"), controller.rejectPayment);

// Admin recovery — rescue a paid-but-not-unlocked order by Razorpay id.
// Body: { paymentId } or { orderId } (from the Razorpay dashboard / email).
router.post("/reconcile", authMiddleware, authorize("superadmin"), controller.reconcilePayment);

export default router;


