import express from "express";
import * as controller from "./question.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createQuestionSchema,
  updateQuestionSchema,
  bulkCreateQuestionsSchema,
} from "../../shared/validations/question.validation.js";

const router = express.Router();

router.use(authMiddleware);
router.use(authorize("teacher"));

// Single question CRUD
router.post(
  "/test/:testId",
  validate(createQuestionSchema),
  controller.createQuestion
);

// Bulk create questions
router.post(
  "/test/:testId/bulk",
  validate(bulkCreateQuestionsSchema),
  controller.bulkCreateQuestions
);

// Get all questions for a test
router.get("/test/:testId", controller.getQuestionsByTest);

// Single question operations
router.get("/:questionId", controller.getQuestion);
router.put(
  "/:questionId",
  validate(updateQuestionSchema),
  controller.updateQuestion
);
router.delete("/:questionId", controller.deleteQuestion);

export default router;
