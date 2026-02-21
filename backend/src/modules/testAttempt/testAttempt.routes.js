import express from "express";
import * as controller from "./testAttempt.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  submitAnswerSchema,
  submitTestSchema,
} from "../../shared/validations/testAttempt.validation.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("student"));

// Start a test
router.post("/start/:testId", controller.startTest);

// Save individual answer (auto-save)
router.post(
  "/:attemptId/answer",
  validate(submitAnswerSchema),
  controller.submitAnswer
);
// Submit entire test
router.post(
  "/:attemptId/submit",
  validate(submitTestSchema),
  controller.submitTest
);

// Get result
router.get("/:attemptId/result", controller.getResult);

// Get all my attempts
router.get("/my-attempts", controller.getMyAttempts);

// Get leaderboard (public for students)
router.get("/leaderboard/:testId", controller.getLeaderboard);

export default router;
