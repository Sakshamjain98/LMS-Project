import express from "express";
import * as controller from "./analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("teacher"));

// ========== TEST ANALYTICS ==========
// Standalone route for test analytics
router.get("/test/:testId", controller.getTestAnalytics);

// Question analytics within test (can be called from both routes)
router.get(
  "/test/:testId/question/:questionId",
  controller.getQuestionAnalytics
);

// ========== QUESTION BANK ANALYTICS ==========
// Question bank analytics (across all tests)
router.get("/question/:questionId", controller.getQuestionBankAnalytics);

export default router;
