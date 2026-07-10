import mongoose from "mongoose";
import TestAttempt from "../../models/testAttempt.model.js";
import Test from "../../models/test.model.js";
import Question from "../../models/question.model.js";
import TestSeriesTopic from "../../models/testSeriesTopic.model.js";
import TopicAccess from "../../models/topicAccess.model.js";
import { userCanAccessTestViaCourse } from "../courses/courses.service.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import {
  calculateMarksForAnswer,
  isAnswerCorrect,
  calculateTestResult,
  validateTestTiming,
  hasExceededTimeLimit,
  generateDetailedResult,
  shuffleArray,
  buildAttemptQuestionsForStudent,
  toCanonicalOptionIndex,
} from "../../shared/utils/evaluation.utils.js";

// True when the student holds a valid (non-disabled, non-expired) unlock for
// the given paid topic. Access is purely per-topic — there is no subscription.
const hasValidTopicAccess = async (studentId, topicId) => {
  const access = await TopicAccess.findOne({
    userId: studentId,
    topicId,
    disabled: { $ne: true },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
  return Boolean(access);
};

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
 * Start or resume test
 */
export const startTest = async (testId, studentId) => {
  const objTestId = validateTestId(testId);
  const objStudentId = validateUserId(studentId);

  const test = await Test.findById(objTestId).lean();
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  }

  // Validate test timing
  const timingCheck = validateTestTiming(test);
  if (!timingCheck.valid) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, timingCheck.reason);
  }

  // Check if test is published
  if (test.status !== "published" || test.isVisible === false) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test is not available");
  }

  // Paid-topic gating — pricing lives on the parent test series (topic).
  // Access requires a valid per-topic unlock (time-bound; renew when expired),
  // OR the test being linked into a course the student has purchased — in which
  // case only that linked test opens, not the whole series.
  if (test.topicId) {
    const topic = await TestSeriesTopic.findById(test.topicId).lean();
    if (topic?.isPaid) {
      const topicOk = await hasValidTopicAccess(objStudentId, topic._id);
      if (!topicOk) {
        const viaCourse = await userCanAccessTestViaCourse(objStudentId, objTestId);
        if (!viaCourse) {
          throw new ApiError(
            STATUS_CODES.FORBIDDEN,
            `This test belongs to a premium series. Unlock it for ₹${Number(topic.price || 0).toLocaleString()} to start.`
          );
        }
      }
    }
  }

  // Check for existing in-progress attempt
  const existingAttempt = await TestAttempt.findOne({
    testId: objTestId,
    studentId: objStudentId,
    status: "in_progress",
  }).lean();

  if (existingAttempt) {
    // Return existing attempt for resume — same questionOrder/optionOrders
    // computed when the attempt was created, so the shuffle stays stable.
    const questions = await Question.find({
      _id: { $in: test.questions },
    }).lean();

    return {
      attempt: existingAttempt,
      questions: buildAttemptQuestionsForStudent(questions, existingAttempt.questionOrder, existingAttempt.optionOrders),
      duration: test.duration,
      isProctored: Boolean(test.isProctored),
      testTitle: test.title,
      resuming: true,
    };
  }

  const attemptLimit = Number(test.attemptLimit) || 0;
  if (attemptLimit > 0) {
    const attemptCount = await TestAttempt.countDocuments({
      testId: objTestId,
      studentId: objStudentId,
    });

    if (attemptCount >= attemptLimit) {
      throw new ApiError(
        STATUS_CODES.CONFLICT,
        "Attempt limit reached for this test."
      );
    }
  }

  // Get questions
  const questions = await Question.find({
    _id: { $in: test.questions },
  }).lean();

  // Base the canonical order on test.questions (the teacher's authored order)
  // rather than the $in query's result, which Mongo never guarantees to match.
  const validIds = new Set(questions.map((q) => q._id.toString()));
  const canonicalOrder = (test.questions || []).filter((id) => validIds.has(id.toString()));
  const questionOrder = test.shuffleQuestions ? shuffleArray(canonicalOrder) : canonicalOrder;

  const optionOrders = questions.map((q) => {
    const identity = q.options.map((_, i) => i);
    return { questionId: q._id, order: test.shuffleOptions ? shuffleArray(identity) : identity };
  });

  // Create new attempt
  const attempt = await TestAttempt.create({
    testId: objTestId,
    studentId: objStudentId,
    totalQuestions: questions.length,
    totalMarks: test.totalMarks || 0,
    status: "in_progress",
    questionOrder,
    optionOrders,
  });

  return {
    attempt: attempt.toObject(),
    questions: buildAttemptQuestionsForStudent(questions, questionOrder, optionOrders),
    duration: test.duration,
    isProctored: Boolean(test.isProctored),
    testTitle: test.title,
    resuming: false,
  };
};

/**
 * Read-only preview for students before starting the test.
 */
export const getTestPreview = async (testId, studentId) => {
  const objTestId = validateTestId(testId);
  const objStudentId = validateUserId(studentId);

  const test = await Test.findById(objTestId).lean();
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  }

  const timingCheck = validateTestTiming(test);
  if (!timingCheck.valid) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, timingCheck.reason);
  }

  if (test.status !== "published" || test.isVisible === false) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test is not available");
  }

  if (test.topicId) {
    const topic = await TestSeriesTopic.findById(test.topicId).lean();
    if (topic?.isPaid) {
      const topicOk = await hasValidTopicAccess(objStudentId, topic._id);
      if (!topicOk) {
        const viaCourse = await userCanAccessTestViaCourse(objStudentId, objTestId);
        if (!viaCourse) {
          throw new ApiError(
            STATUS_CODES.FORBIDDEN,
            `This test belongs to a premium series. Unlock it for ₹${Number(topic.price || 0).toLocaleString()} to view details.`
          );
        }
      }
    }
  }

  const attemptCount = await TestAttempt.countDocuments({
    testId: objTestId,
    studentId: objStudentId,
  });

  return {
    test: {
      _id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks || 0,
      passingMarks: test.passingMarks || 0,
      attemptLimit: Number(test.attemptLimit) || 0,
      isProctored: Boolean(test.isProctored),
      isPaid: Boolean(test.isPaid),
      type: test.type || "practice",
      status: test.status,
      questionsCount: Array.isArray(test.questions) ? test.questions.length : 0,
      negativeMarking: Number(test.negativeMarking) || 0,
      allowReview: test.allowReview !== false,
      showSolution: test.showSolution !== false,
    },
    attemptCount,
    canStart: true,
  };
};

/**
 * Submit a single answer
 */
export const submitAnswer = async (attemptId, answerData, studentId) => {
  const objAttemptId = validateTestId(attemptId);
  const objStudentId = validateUserId(studentId);

  const attempt = await TestAttempt.findOne({
    _id: objAttemptId,
    studentId: objStudentId,
    status: "in_progress",
  });

  if (!attempt) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Attempt not found or already submitted"
    );
  }

  const { questionId, selectedOptionIndex: rawIndex, timeTaken } = answerData;

  // Verify question and test ownership
  const question = await Question.findById(questionId).lean();
  if (!question || question.testId.toString() !== attempt.testId.toString()) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid question");
  }

  // rawIndex arrives in display (shuffled) coordinates; convert to canonical
  // before scoring/persisting so attempt.answers always stores canonical indices.
  const selectedOptionIndex = toCanonicalOptionIndex(rawIndex, attempt.optionOrders, questionId);

  // Check time limit
  const test = await Test.findById(attempt.testId).lean();
  if (hasExceededTimeLimit(attempt, test)) {
    attempt.status = "evaluated";
    await attempt.save();
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Time limit exceeded");
  }

  // Calculate marks
  const marksObtained = calculateMarksForAnswer(question, selectedOptionIndex);
  const isCorrect = isAnswerCorrect(question, selectedOptionIndex);

  // Find and update existing answer or create new
  const existingIndex = attempt.answers.findIndex(
    (a) => a.questionId.toString() === questionId
  );

  const answerEntry = {
    questionId,
    selectedOptionIndex,
    isCorrect,
    marksObtained,
    timeTaken,
  };

  if (existingIndex >= 0) {
    attempt.answers[existingIndex] = answerEntry;
  } else {
    attempt.answers.push(answerEntry);
  }

  await attempt.save();

  return { saved: true, isCorrect, marksObtained };
};

/**
 * Final test submission with auto-evaluation
 */
export const submitTest = async (attemptId, answersData, studentId) => {
  const objAttemptId = validateTestId(attemptId);
  const objStudentId = validateUserId(studentId);

  const attempt = await TestAttempt.findOne({
    _id: objAttemptId,
    studentId: objStudentId,
  });

  if (!attempt) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Attempt not found or already submitted"
    );
  }

  if (attempt.status !== "in_progress") {
    const rank =
      (await TestAttempt.countDocuments({
        testId: attempt.testId,
        status: "evaluated",
        marksObtained: { $gt: attempt.marksObtained },
      })) + 1;

    return {
      ...attempt.toObject(),
      rank,
      alreadySubmitted: true,
    };
  }

  const test = await Test.findById(attempt.testId).lean();
  // Fetch by test.questions (same source startTest used to decide what the
  // student was shown), not by Question.testId — those two can drift apart
  // (edits/reorders/question-bank clones), and scoring against a different
  // question set than the one the student answered makes every answer fail
  // to match, so the whole attempt reads as skipped with a zero score.
  const questions = await Question.find({ _id: { $in: test.questions } }).lean();

  // `answersData.answers` can be partial/empty (auto-submit scenarios, or the
  // client's final payload just not round-tripping fully) — attempt.answers,
  // kept current by each in-flight submitAnswer call, is the reliable ground
  // truth, so a question missing from the request falls back to it. Clearing
  // a response calls submitAnswer with selectedOptionIndex: null (TestPlayer's
  // handleClearResponse), which keeps that fallback accurate for a cleared
  // question too — it lands here as an explicit null (skipped), never a stale
  // pre-clear value.
  const requestAnswers = Array.isArray(answersData?.answers) ? answersData.answers : [];
  const requestAnswerMap = new Map(
    requestAnswers
      .filter((answer) => answer?.questionId)
      .map((answer) => [answer.questionId.toString(), answer])
  );
  const savedAnswerMap = new Map(
    (attempt.answers || [])
      .filter((answer) => answer?.questionId)
      .map((answer) => [answer.questionId.toString(), answer])
  );

  // Build a complete answer list for all questions so skipped count is always accurate.
  attempt.answers = questions.map((question) => {
    const questionId = question._id.toString();
    const requestAnswer = requestAnswerMap.get(questionId);
    const savedAnswer = savedAnswerMap.get(questionId);
    const mergedAnswer = requestAnswer || savedAnswer || {};

    const rawIndex =
      mergedAnswer.selectedOptionIndex === undefined
        ? null
        : mergedAnswer.selectedOptionIndex;
    // requestAnswer is raw client input (display coords) and needs conversion
    // each time; savedAnswer was already converted+persisted by submitAnswer —
    // converting it again would silently corrupt it, so only convert values
    // that came fresh from the request body.
    const selectedOptionIndex = requestAnswer
      ? toCanonicalOptionIndex(rawIndex, attempt.optionOrders, question._id)
      : rawIndex;

    const isCorrect = isAnswerCorrect(question, selectedOptionIndex);
    const marksObtained = calculateMarksForAnswer(question, selectedOptionIndex);

    return {
      questionId: question._id,
      selectedOptionIndex,
      isCorrect,
      marksObtained,
      timeTaken: Number(mergedAnswer.timeTaken) || 0,
    };
  });

  // Mark if this submission was triggered automatically (proctoring/time expiry)
  attempt.autoSubmitted = Boolean(answersData.autoSubmitted);

  // Calculate result
  attempt.timeTaken = Math.round((Date.now() - attempt.startedAt) / 1000);
  attempt.submittedAt = new Date();
  // Keep existing status workflow: evaluated means result is available.
  attempt.status = "evaluated";

  const result = calculateTestResult(
    attempt.answers,
    questions,
    attempt.totalMarks
  );

  attempt.correctAnswers = result.correctAnswers;
  attempt.wrongAnswers = result.wrongAnswers;
  attempt.attemptedQuestions = result.attemptedQuestions;
  attempt.skippedQuestions = result.skippedQuestions;
  attempt.marksObtained = result.marksObtained;
  attempt.percentage = result.percentage;

  await attempt.save();

  // Calculate rank
  const rank =
    (await TestAttempt.countDocuments({
      testId: attempt.testId,
      status: "evaluated",
      marksObtained: { $gt: attempt.marksObtained },
    })) + 1;

  return { ...attempt.toObject(), rank };
};

/**
 * Get detailed test result with solutions
 */
export const getTestResult = async (attemptId, studentId) => {
  const objAttemptId = validateTestId(attemptId);
  const objStudentId = validateUserId(studentId);

  const attempt = await TestAttempt.findOne({
    _id: objAttemptId,
    studentId: objStudentId,
  }).lean();

  if (!attempt) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Attempt not found");
  }

  if (attempt.status === "in_progress") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test not yet submitted");
  }

  const questions = await Question.find({
    testId: attempt.testId,
  }).lean();

  const test = await Test.findById(attempt.testId).lean();

  // Calculate rank
  const rank =
    (await TestAttempt.countDocuments({
      testId: attempt.testId,
      status: "evaluated",
      marksObtained: { $gt: attempt.marksObtained },
    })) + 1;

  return {
    test: {
      title: test.title,
      description: test.description,
      totalMarks: test.totalMarks,
      duration: test.duration,
    },
    result: {
      totalQuestions: attempt.totalQuestions,
      attemptedQuestions: attempt.attemptedQuestions,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      skippedQuestions: attempt.skippedQuestions,
      totalMarks: attempt.totalMarks,
      marksObtained: attempt.marksObtained,
      percentage: attempt.percentage,
      timeTaken: attempt.timeTaken,
      submittedAt: attempt.submittedAt,
      isCompleted: ["submitted", "evaluated"].includes(attempt.status) || Boolean(attempt.autoSubmitted),
      rank,
    },
    detailedResult: generateDetailedResult(attempt, questions),
  };
};

/**
 * Get student's attempt history
 */
export const getStudentAttempts = async (studentId, limit = 50, skip = 0) => {
  const objStudentId = validateUserId(studentId);

  const docs = await TestAttempt.find({ studentId: objStudentId })
    .populate("testId", "title totalMarks duration")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Add a computed `isCompleted` flag so frontends can consistently display auto-submitted attempts
  return docs.map((d) => ({
    ...d,
    isCompleted: ["submitted", "evaluated"].includes(d.status) || Boolean(d.autoSubmitted),
  }));
};

/**
 * Get test leaderboard (optimized with aggregation)
 */
export const getTestLeaderboard = async (testId, limit = 10) => {
  const objTestId = validateTestId(testId);

  return TestAttempt.aggregate([
    {
      $match: {
        testId: objTestId,
        $or: [ { status: { $in: ["submitted", "evaluated"] } }, { autoSubmitted: true } ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: "$student",
    },
    {
      $sort: {
        marksObtained: -1,
        timeTaken: 1,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        studentId: 1,
        studentName: "$student.name",
        studentEmail: "$student.email",
        marksObtained: 1,
        percentage: 1,
        timeTaken: 1,
        submittedAt: 1,
      },
    },
  ]);
};

/**
 * Get attempt summary (for teachers)
 */
export const getTestAttemptStats = async (testId) => {
  const stats = await TestAttempt.aggregate([
    {
      $match: { $or: [ { testId, status: "evaluated" }, { testId, autoSubmitted: true } ] },
    },
    {
      $group: {
        _id: "$testId",
        totalAttempts: { $sum: 1 },
        averageMarks: { $avg: "$marksObtained" },
        averagePercentage: { $avg: "$percentage" },
        maxMarks: { $max: "$marksObtained" },
        minMarks: { $min: "$marksObtained" },
      },
    },
  ]);

  return stats[0] || {
    totalAttempts: 0,
    averageMarks: 0,
    averagePercentage: 0,
    maxMarks: 0,
    minMarks: 0,
  };
};
