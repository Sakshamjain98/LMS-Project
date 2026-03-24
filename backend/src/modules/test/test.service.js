import mongoose from "mongoose";
import Test from "./test.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

/**
 * Validate and convert testId to ObjectId
 */
const validateTestId = (testId) => {
  if (!testId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "testId is required");
  }
  
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid testId format");
  }
  
  return new mongoose.Types.ObjectId(testId);
};

/**
 * Validate and convert userId to ObjectId
 */
const validateUserId = (userId) => {
  if (!userId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "userId is required");
  }
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid userId format");
  }
  
  return new mongoose.Types.ObjectId(userId);
};

/**
 * Create test
 */
export const createTest = async (data, teacherId) => {
  const objTeacherId = validateUserId(teacherId);
  const payload = data || {};

  if (!payload.title || payload.title.trim().length < 3) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Title must be at least 3 characters");
  }

  if (payload.duration && payload.duration <= 0) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Duration must be greater than 0");
  }

  return Test.create({
    title: payload.title.trim().slice(0, 100),
    description: payload.description?.trim().slice(0, 500) || "",
    duration: payload.duration || 60,
    passingMarks: payload.passingMarks || 0,

    // ✅ IMPORTANT FIX
    isPaid: payload.isPaid ?? false,

    teacherId: objTeacherId,
    status: "draft",
  });
};
/**
 * Get test by ID
 */
export const getTestById = async (testId, teacherId) => {
  const objTestId = validateTestId(testId);
  const objTeacherId = validateUserId(teacherId);

  const test = await Test.findOne({
    _id: objTestId,
    teacherId: objTeacherId,
  }).lean();

  if (!test) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  return test;
};

/**
 * Get test with populated questions
 */
export const getTestWithQuestions = async (testId, teacherId) => {
  const objTestId = validateTestId(testId);
  const objTeacherId = validateUserId(teacherId);

  const test = await Test.findOne({
    _id: objTestId,
    teacherId: objTeacherId,
  })
    .populate("questions")
    .lean();

  if (!test) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  return test;
};

/**
 * Update test
 */
export const updateTest = async (testId, updateData, teacherId) => {
  const objTestId = validateTestId(testId);
  const objTeacherId = validateUserId(teacherId);

  if (!updateData || typeof updateData !== "object") {
    throw new ApiError(400, "Invalid update data");
  }

  if (updateData.title) {
    updateData.title = updateData.title.trim().slice(0, 100);
  }

  if (updateData.duration && updateData.duration <= 0) {
    throw new ApiError(400, "Duration must be > 0");
  }

  return Test.findOneAndUpdate(
    { _id: objTestId, teacherId: objTeacherId },
    { $set: updateData },
    { new: true }
  );
};
/**
 * Save test configuration with safe defaults
 */
export const saveTestConfig = async (testId, config, teacherId) => {
  const configData = config || {};

  // Validate duration
  if (configData.duration && configData.duration <= 0) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Duration must be > 0");
  }

  // Apply safe defaults
  const updatePayload = {
    duration: configData.duration || 60,
    shuffleQuestions: configData.shuffleQuestions ?? false,
    shuffleOptions: configData.shuffleOptions ?? false,
    showResults: configData.showResults ?? true,
    allowRetake: configData.allowRetake ?? false,
    negativeMarks: configData.negativeMarks ?? 0,
  };

  return updateTest(testId, updatePayload, teacherId);
};

/**
 * Publish or schedule test with safe date handling
 */
export const publishTest = async (testId, payload, teacherId) => {
  const data = payload || {};
  const { startTime = null, endTime = null } = data;

  // Determine status
  let status = "published";
  if (startTime) {
    const start = new Date(startTime);
    if (start > new Date()) {
      status = "scheduled";
    }
  }

  return updateTest(
    testId,
    {
      status,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    },
    teacherId
  );
};

/**
 * Get teacher's tests
 */
export const getTeacherTests = async (teacherId) => {
  const objTeacherId = validateUserId(teacherId);

  return Test.find({ teacherId: objTeacherId })
    .select("title description status totalMarks questions duration createdAt")
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Delete test
 */
export const deleteTest = async (testId, teacherId) => {
  const objTestId = validateTestId(testId);
  const objTeacherId = validateUserId(teacherId);

  const test = await Test.findOneAndDelete({
    _id: objTestId,
    teacherId: objTeacherId,
  });

  if (!test) throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  return test;
};

/**
 * Get teacher analytics (placeholder)
 */
export const getTeacherAnalytics = async (teacherId, filters = {}) => {
  const objTeacherId = validateUserId(teacherId);

  const tests = await Test.find({ teacherId: objTeacherId }).lean();
  return {
    totalTests: tests.length,
    draftTests: tests.filter((t) => t.status === "draft").length,
    publishedTests: tests.filter((t) => t.status === "published").length,
  };
};