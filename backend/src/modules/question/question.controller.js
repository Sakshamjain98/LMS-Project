import * as service from "./question.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await service.createQuestion(
    req.params.testId,
    req.body,
    req.user._id
  );

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Question created successfully",
    question,
  });
});

export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const questions = await service.bulkCreateQuestions(
    req.params.testId,
    req.body.questions,
    req.user._id
  );

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: `${questions.length} questions created successfully`,
    questions,
  });
});

export const getQuestionsByTest = asyncHandler(async (req, res) => {
  const questions = await service.getQuestionsByTest(
    req.params.testId,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    count: questions.length,
    questions,
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await service.getQuestionById(
    req.params.questionId,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    question,
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await service.updateQuestion(
    req.params.questionId,
    req.body,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Question updated successfully",
    question,
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await service.deleteQuestion(req.params.questionId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Question deleted successfully",
  });
});
