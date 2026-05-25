import express from "express";
import * as controller from "./testAttempt.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("student"));

// ========== ATTEMPT MANAGEMENT ==========
router.get("/preview/:testId", controller.previewTest);
router.post("/start/:testId", controller.startTest);
router.post("/:attemptId/answer", controller.submitAnswer);
router.post("/:attemptId/submit", controller.submitTest);

// ========== RESULTS & HISTORY ==========
// IMPORTANT: Place named routes BEFORE dynamic routes
router.get("/my-attempts", controller.getMyAttempts);
router.get("/leaderboard/:testId", controller.getLeaderboard);

// Dynamic routes last
router.get("/:attemptId/result", controller.getResult);

export default router;
