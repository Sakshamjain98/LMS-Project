import * as analyticsService from "./analytics.service.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ApiError } from "../../shared/error/ApiError.js";

/**
 * Get comprehensive test analytics
 */
export const getTestAnalytics = asyncHandler(async (req, res) => {
  const { testId } = req.params;

  // Validate testId is provided
  if (!testId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "testId is required");
  }

  const data = await analyticsService.getTestAnalytics(testId, req.user._id);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    ...data,
  });
});

/**
 * Get question-level analytics within a test
 */
export const getQuestionAnalytics = asyncHandler(async (req, res) => {
  const { testId, questionId } = req.params;

  // Validate both IDs are provided
  if (!testId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "testId is required");
  }

  if (!questionId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "questionId is required");
  }

  const data = await analyticsService.getQuestionAnalytics(
    testId,
    questionId,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    analytics: data,
  });
});

/**
 * Get question bank analytics (across all tests)
 */
export const getQuestionBankAnalytics = asyncHandler(async (req, res) => {
  const { questionId } = req.params;

  // Validate questionId is provided
  if (!questionId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "questionId is required");
  }

  const data = await analyticsService.getQuestionBankAnalytics(
    questionId,
    req.user._id
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    analytics: data,
  });
});
