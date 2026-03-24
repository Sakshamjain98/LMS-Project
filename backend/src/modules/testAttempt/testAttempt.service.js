import mongoose from "mongoose";
import TestAttempt from "../../models/testAttempt.model.js";
import Test from "../test/test.model.js";
import Question from "../../models/question.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import {
  calculateMarksForAnswer,
  isAnswerCorrect,
  calculateTestResult,
  sanitizeQuestionsForStudent,
  validateTestTiming,
  hasExceededTimeLimit,
  generateDetailedResult,
} from "../../shared/utils/evaluation.utils.js";

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
  if (test.status !== "published") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test is not available");
  }

  // Check for existing in-progress attempt
  const existingAttempt = await TestAttempt.findOne({
    testId: objTestId,
    studentId: objStudentId,
    status: "in_progress",
  }).lean();

  if (existingAttempt) {
    // Return existing attempt for resume
    const questions = await Question.find({
      _id: { $in: test.questions },
    }).lean();

    return {
      attempt: existingAttempt,
      questions: sanitizeQuestionsForStudent(questions),
      duration: test.duration,
      resuming: true,
    };
  }

  // Check if already submitted
  const submittedAttempt = await TestAttempt.findOne({
    testId: objTestId,
    studentId: objStudentId,
    status: { $in: ["submitted", "evaluated"] },
  }).lean();

  if (submittedAttempt) {
    throw new ApiError(
      STATUS_CODES.CONFLICT,
      "Test already submitted. Retake not allowed."
    );
  }

  // Get questions
  const questions = await Question.find({
    _id: { $in: test.questions },
  }).lean();

  // Create new attempt
  const attempt = await TestAttempt.create({
    testId: objTestId,
    studentId: objStudentId,
    totalQuestions: questions.length,
    totalMarks: test.totalMarks || 0,
    status: "in_progress",
  });

  return {
    attempt: attempt.toObject(),
    questions: sanitizeQuestionsForStudent(questions),
    duration: test.duration,
    resuming: false,
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

  const { questionId, selectedOptionIndex, timeTaken } = answerData;

  // Verify question and test ownership
  const question = await Question.findById(questionId).lean();
  if (!question || question.testId.toString() !== attempt.testId.toString()) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid question");
  }

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
    status: "in_progress",
  });

  if (!attempt) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Attempt not found or already submitted"
    );
  }

  const test = await Test.findById(attempt.testId).lean();
  const questions = await Question.find({ testId: attempt.testId }).lean();

  // Auto-evaluate
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  attempt.answers = answersData.answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      return {
        questionId: answer.questionId,
        selectedOptionIndex: null,
        isCorrect: false,
        marksObtained: 0,
        timeTaken: answer.timeTaken || 0,
      };
    }

    const isCorrect = isAnswerCorrect(question, answer.selectedOptionIndex);
    const marksObtained = calculateMarksForAnswer(
      question,
      answer.selectedOptionIndex
    );

    return {
      questionId: answer.questionId,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect,
      marksObtained,
      timeTaken: answer.timeTaken || 0,
    };
  });

  // Calculate result
  attempt.timeTaken = Math.round((Date.now() - attempt.startedAt) / 1000);
  attempt.submittedAt = new Date();
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

  return TestAttempt.find({ studentId: objStudentId })
    .populate("testId", "title totalMarks duration")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
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
        status: { $in: ["submitted", "evaluated"] },
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
      $match: { testId, status: "evaluated" },
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
