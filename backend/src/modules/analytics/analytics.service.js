import mongoose from "mongoose";
import TestAttempt from "../../models/testAttempt.model.js";
import Question from "../../models/question.model.js";
import Test from "../test/test.model.js";
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
 * Get comprehensive test analytics
 */
export const getTestAnalytics = async (testId, teacherId) => {
  const objTestId = validateTestId(testId);
  const objTeacherId = validateUserId(teacherId);

  // Verify test exists and belongs to teacher
  const test = await Test.findOne({
    _id: objTestId,
    teacherId: objTeacherId,
  }).lean();

  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or unauthorized"
    );
  }

  const attempts = await TestAttempt.find({
    testId: objTestId,
    status: { $in: ["submitted", "evaluated"] },
  }).lean();

  if (attempts.length === 0) {
    return {
      testId: testId.toString(),
      totalAttempts: 0,
      averageScore: "0.00",
      averagePercentage: "0.00",
      accuracy: "0",
      completionRate: "0.00",
      maxScore: 0,
      minScore: 0,
      averageTime: "0",
    };
  }

  const totalAttempts = attempts.length;
  const scores = attempts.map((a) => a.marksObtained || 0);
  const percentages = attempts.map((a) => a.percentage || 0);
  const times = attempts.map((a) => a.timeTaken || 0);
  const correctAnswers = attempts.reduce((sum, a) => sum + (a.correctAnswers || 0), 0);
  const totalAnswered = attempts.reduce((sum, a) => sum + (a.attemptedQuestions || 0), 0);

  return {
    testId: testId.toString(),
    totalAttempts,
    averageScore: (scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(2),
    averagePercentage: (percentages.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(2),
    accuracy: totalAnswered > 0
      ? ((correctAnswers / totalAnswered) * 100).toFixed(2)
      : "0",
    completionRate: ((totalAttempts / attempts.length) * 100).toFixed(2),
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    averageTime: (times.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(0),
  };
};

/**
 * Get question-level analytics within a test
 */
export const getQuestionAnalytics = async (testId, questionId, teacherId) => {
  const objTestId = validateTestId(testId);
  const objQuestionId = validateTestId(questionId); // Convert to ObjectId
  const objTeacherId = validateUserId(teacherId);

  // Verify test exists and belongs to teacher
  const test = await Test.findOne({
    _id: objTestId,
    teacherId: objTeacherId,
  }).lean();

  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or unauthorized"
    );
  }

  // Verify question exists in this test
  const question = await Question.findOne({
    _id: objQuestionId,
    testId: objTestId,
  }).lean();

  if (!question) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Question not found in this test"
    );
  }

  const attempts = await TestAttempt.find({
    testId: objTestId,
    status: { $in: ["submitted", "evaluated"] },
  }).lean();

  if (attempts.length === 0) {
    return {
      questionId: questionId.toString(),
      questionText: question.questionText,
      totalAttempts: 0,
      correctAttempts: 0,
      wrongAttempts: 0,
      skippedCount: 0,
      accuracy: "0",
      skipRate: "0",
      averageTime: "0",
      difficulty: question.difficulty,
      marks: question.marks,
    };
  }

  let correctCount = 0;
  let attemptedCount = 0;
  let skippedCount = 0;
  let totalTime = 0;

  attempts.forEach((attempt) => {
    const answer = attempt.answers.find(
      (a) => a.questionId.toString() === objQuestionId.toString()
    );

    if (answer) {
      if (answer.selectedOptionIndex === null) {
        skippedCount++;
      } else {
        attemptedCount++;
        if (answer.isCorrect) {
          correctCount++;
        }
        totalTime += answer.timeTaken || 0;
      }
    } else {
      skippedCount++;
    }
  });

  return {
    questionId: questionId.toString(),
    questionText: question.questionText,
    totalAttempts: attempts.length,
    correctAttempts: correctCount,
    wrongAttempts: attemptedCount - correctCount,
    skippedCount,
    accuracy: attemptedCount > 0
      ? ((correctCount / attemptedCount) * 100).toFixed(2)
      : "0",
    skipRate: attempts.length > 0
      ? ((skippedCount / attempts.length) * 100).toFixed(2)
      : "0",
    averageTime: attemptedCount > 0
      ? (totalTime / attemptedCount).toFixed(2)
      : "0",
    difficulty: question.difficulty,
    marks: question.marks,
  };
};

/**
 * Get question bank analytics (for re-usable questions)
 */
export const getQuestionBankAnalytics = async (questionId, teacherId) => {
  const objQuestionId = validateTestId(questionId);
  const objTeacherId = validateUserId(teacherId);

  const question = await Question.findOne({
    _id: objQuestionId,
    createdBy: objTeacherId,
  }).lean();

  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  const attempts = await TestAttempt.aggregate([
    {
      $match: { status: { $in: ["submitted", "evaluated"] } },
    },
    {
      $unwind: "$answers",
    },
    {
      $match: {
        "answers.questionId": objQuestionId,
      },
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        correctCount: {
          $sum: { $cond: ["$answers.isCorrect", 1, 0] },
        },
        averageTime: { $avg: "$answers.timeTaken" },
      },
    },
  ]);

  if (!attempts.length) {
    return {
      questionId: questionId.toString(),
      totalAttempts: 0,
      accuracy: "0",
      averageTime: "0",
    };
  }

  const stat = attempts[0];
  return {
    questionId: questionId.toString(),
    totalAttempts: stat.totalAttempts,
    accuracy: ((stat.correctCount / stat.totalAttempts) * 100).toFixed(2),
    averageTime: stat.averageTime ? stat.averageTime.toFixed(2) : "0",
  };
};
