import * as service from "./question.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/error/ApiError.js";

export const createQuestion = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { testId } = req.params;

  if (!body.questionText) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "questionText is required");
  }

  const question = await service.createQuestion(
    testId,
    body,
    req.user._id
  );

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: "Question created successfully",
    data: question,
  });
});

export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { testId } = req.params;

  if (!Array.isArray(body.questions)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "questions must be an array");
  }

  const createdQuestions = await service.bulkCreateQuestions(
    testId,
    body.questions,
    req.user._id
  );

  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: `${createdQuestions.length} questions created successfully`,
    data: {
      count: createdQuestions.length,
      questions: createdQuestions,
    },
  });
});

export const getQuestionsByTest = asyncHandler(async (req, res) => {
  const questions = await service.getQuestionsByTest(
    req.params.testId,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      count: questions.length,
      questions,
    },
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await service.getQuestionById(
    req.params.questionId,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: question,
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const question = await service.updateQuestion(
    req.params.questionId,
    body,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Question updated successfully",
    data: question,
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await service.deleteQuestion(req.params.questionId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Question deleted successfully",
  });
});
