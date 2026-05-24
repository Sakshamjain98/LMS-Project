import mongoose from "mongoose";
import Test from "./test.model.js";
import TestSeriesChapter from "../../models/testSeriesChapter.model.js";
import TestSeriesSubject from "../../models/testSeriesSubject.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import Question from "../../models/question.model.js";
import TestConfig from "../../models/testConfig.model.js";
import TestAttempt from "../../models/testAttempt.model.js";
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

const validateObjectId = (value, label) => {
  if (!value) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `${label} is required`);
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Invalid ${label} format`);
  }
  return new mongoose.Types.ObjectId(value);
};

const normalizeTestType = (rawType, { allowAits = false } = {}) => {
  if (rawType === undefined || rawType === null) {
    return "practice";
  }

  const normalized = String(rawType).trim().toLowerCase();

  if (["pyq", "previous_year", "previous-year", "previousyear"].includes(normalized)) {
    return "pyq";
  }

  if (normalized === "practice") {
    return "practice";
  }

  if (allowAits && normalized === "aits") {
    return "aits";
  }

  return "practice";
};

const resolveHierarchyFromChapter = async (chapterId, teacherId) => {
  const objChapterId = validateObjectId(chapterId, "chapterId");
  const objTeacherId = validateUserId(teacherId);

  const chapter = await TestSeriesChapter.findOne({ _id: objChapterId, teacherId: objTeacherId }).lean();
  if (!chapter) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Chapter not found");
  }

  const subject = await TestSeriesSubject.findOne({ _id: chapter.subjectId, teacherId: objTeacherId }).lean();
  if (!subject) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Subject not found");
  }

  const topic = await TestSeriesTopic.findOne({ _id: subject.topicId, teacherId: objTeacherId }).lean();
  if (!topic) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Topic not found");
  }

  return { chapter, subject, topic };
};

/**
 * Create test
 */
export const createTest = async (data, teacherId) => {
  const objTeacherId = validateUserId(teacherId);
  const payload = data || {};

  if (!payload.chapterId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "chapterId is required");
  }

  const hierarchy = await resolveHierarchyFromChapter(payload.chapterId, objTeacherId);

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
    startTime: payload.startTime || undefined,
    endTime: payload.endTime || undefined,
    instructions: payload.instructions?.trim().slice(0, 1000) || "",
    attemptLimit: Number.isFinite(payload.attemptLimit) ? Math.max(payload.attemptLimit, 0) : 0,
    isProctored: payload.isProctored ?? false,
    isPaid: payload.isPaid ?? false,

    shuffleQuestions: Boolean(payload.shuffleQuestions),
    shuffleOptions:   Boolean(payload.shuffleOptions),
    showSolution:     payload.showSolution !== false,
    allowReview:      payload.allowReview !== false,
    negativeMarking:  Math.max(0, Number(payload.negativeMarking) || 0),

    // Preserve and normalize the chosen test type.
    type: normalizeTestType(payload.type),

    teacherId: objTeacherId,
    topicId: hierarchy.topic._id,
    subjectId: hierarchy.subject._id,
    chapterId: hierarchy.chapter._id,
    status: "published",
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
  })
    .populate("topicId", "title")
    .populate("subjectId", "title")
    .populate("chapterId", "title")
    .lean();

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
    .populate("topicId", "title")
    .populate("subjectId", "title")
    .populate("chapterId", "title")
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

  if (updateData.attemptLimit !== undefined) {
    const limit = Number(updateData.attemptLimit);
    if (Number.isNaN(limit) || limit < 0) {
      throw new ApiError(400, "Attempt limit must be 0 or a positive number");
    }
    updateData.attemptLimit = limit;
  }

  if (updateData.chapterId) {
    const hierarchy = await resolveHierarchyFromChapter(updateData.chapterId, objTeacherId);
    updateData.topicId = hierarchy.topic._id;
    updateData.subjectId = hierarchy.subject._id;
    updateData.chapterId = hierarchy.chapter._id;
  }

  // Sanitize and normalize type — reject "aits" here (managed separately)
  if (updateData.type !== undefined) {
    updateData.type = normalizeTestType(updateData.type);
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

  if (configData.duration && configData.duration <= 0) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Duration must be > 0");
  }

  // Pass the full set of configuration fields through. The earlier version
  // dropped `isProctored` (and a few others), so toggling Proctored Mode in the
  // admin UI silently failed to persist. Map every flag the front-end sends.
  const updatePayload = {
    duration: configData.duration || 60,
    shuffleQuestions: configData.shuffleQuestions ?? false,
    shuffleOptions: configData.shuffleOptions ?? false,
    isProctored: Boolean(configData.isProctored),
    showSolution: configData.showSolution !== false,
    allowReview: configData.allowReview !== false,
    negativeMarking: Math.max(0, Number(configData.negativeMarking) || 0),
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
export const getTeacherTests = async (teacherId, query = {}) => {
  const objTeacherId = validateUserId(teacherId);

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const search = query.search?.trim();
  const status = query.status?.trim();
  const topicId = query.topicId?.trim();
  const subjectId = query.subjectId?.trim();
  const chapterId = query.chapterId?.trim();

  const filter = { teacherId: objTeacherId };
  if (status) {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (topicId) {
    filter.topicId = topicId;
  }
  if (subjectId) {
    filter.subjectId = subjectId;
  }
  if (chapterId) {
    filter.chapterId = chapterId;
  }

  const [tests, total] = await Promise.all([
    Test.find(filter)
      .select("title description status totalMarks questions duration createdAt topicId subjectId chapterId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Test.countDocuments(filter),
  ]);

  return {
    tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
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
  await Promise.all([
    Question.deleteMany({ testId: objTestId }),
    TestConfig.deleteMany({ testId: objTestId }),
    TestAttempt.deleteMany({ testId: objTestId }),
  ]);
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