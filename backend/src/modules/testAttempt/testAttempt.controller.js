import * as service from "./testAttempt.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/error/ApiError.js";

export const startTest = asyncHandler(async (req, res) => {
  const result = await service.startTest(req.params.testId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Test started",
    data: result,
  });
});

export const previewTest = asyncHandler(async (req, res) => {
  const result = await service.getTestPreview(req.params.testId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: result,
  });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Validate required fields
  if (!body.questionId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "questionId is required");
  }

  const result = await service.submitAnswer(
    req.params.attemptId,
    body,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Answer saved",
    data: result,
  });
});

export const submitTest = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Validate answers array
  if (!Array.isArray(body.answers)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "answers must be an array");
  }

  const attempt = await service.submitTest(
    req.params.attemptId,
    body,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Test submitted successfully",
    data: {
      totalQuestions: attempt.totalQuestions,
      attemptedQuestions: attempt.attemptedQuestions,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      skippedQuestions: attempt.skippedQuestions,
      totalMarks: attempt.totalMarks,
      marksObtained: attempt.marksObtained,
      percentage: attempt.percentage,
    },
  });
});

export const getResult = asyncHandler(async (req, res) => {
  const result = await service.getTestResult(req.params.attemptId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: result,
  });
});

export const getMyAttempts = asyncHandler(async (req, res) => {
  const query = req.query || {};
  const limit = parseInt(query.limit) || 50;
  const skip = parseInt(query.skip) || 0;

  const attempts = await service.getStudentAttempts(
    req.user._id,
    limit,
    skip
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: attempts,
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const query = req.query || {};
  const limit = Math.min(parseInt(query.limit) || 10, 100); // Cap at 100

  const leaderboard = await service.getTestLeaderboard(
    req.params.testId,
    limit
  );

  // Add rank numbers
  const withRank = leaderboard.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    data: {
      leaderboard: withRank,
      totalEntries: withRank.length,
    },
  });
});
