import * as service from "./testAttempt.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

export const startTest = asyncHandler(async (req, res) => {
  const result = await service.startTest(req.params.testId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Test started",
    ...result,
  });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const result = await service.submitAnswer(
    req.params.attemptId,
    req.body,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Answer saved",
    ...result,
  });
});

export const submitTest = asyncHandler(async (req, res) => {
  const attempt = await service.submitTest(
    req.params.attemptId,
    req.body,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: "Test submitted successfully",
    result: {
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
    ...result,
  });
});

export const getMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await service.getStudentAttempts(req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    attempts,
  });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await service.getTestLeaderboard(
    req.params.testId,
    parseInt(req.query.limit) || 10
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    leaderboard,
  });
});
