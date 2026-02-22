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
router.post("/start/:testId", controller.startTest);
router.post(
  "/:attemptId/answer",
  validate(submitAnswerSchema),
  controller.submitAnswer
);
router.post(
  "/:attemptId/submit",
  validate(submitTestSchema),
  controller.submitTest
);
router.get("/:attemptId/result", controller.getResult);
router.get("/my-attempts", controller.getMyAttempts);
router.get("/leaderboard/:testId", controller.getLeaderboard);
export default router;
