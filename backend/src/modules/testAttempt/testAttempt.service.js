import TestAttempt from "../../models/testAttempt.model.js";
import Test from "../test/test.model.js";
import Question from "../../models/question.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

export const startTest = async (testId, studentId) => {
  // Check if test exists and is published
  const test = await Test.findById(testId);
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  }

  if (test.status !== "published") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test is not available");
  }

  // Check if already attempted
  const existingAttempt = await TestAttempt.findOne({ testId, studentId });
  if (existingAttempt) {
    if (existingAttempt.status === "submitted" || existingAttempt.status === "evaluated") {
      throw new ApiError(STATUS_CODES.CONFLICT, "Test already submitted");
    }
    // Return existing in-progress attempt
    return existingAttempt;
  }

  // Get questions for this test (without correct answers for student)
  const questions = await Question.find({
    _id: { $in: test.questions }
  }).select("-correctOptionIndex -options.isCorrect -explanation");
  

  // Calculate total marks
  const allQuestions = await Question.find({ testId });
  const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
  // Create new attempt
  const attempt = await TestAttempt.create({
    testId,
    studentId,
    totalQuestions: questions.length,
    totalMarks,
    status: "in_progress",
  });

  return {
    attempt,
    questions,
    duration: test.duration,
  };
};

export const submitAnswer = async (attemptId, answerData, studentId) => {
  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    studentId,
    status: "in_progress",
  });

  if (!attempt) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Attempt not found or already submitted");
  }

  const { questionId, selectedOptionIndex, timeTaken } = answerData;

  // Get question to verify answer
  const question = await Question.findById(questionId);
  if (!question || question.testId.toString() !== attempt.testId.toString()) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid question");
  }

  // Check if answer already exists
  const existingAnswerIndex = attempt.answers.findIndex(
    (a) => a.questionId.toString() === questionId
  );

  const isCorrect = selectedOptionIndex !== null && 
    question.correctOptionIndex === selectedOptionIndex;
  
  const marksObtained = selectedOptionIndex === null
    ? 0
    : isCorrect
    ? question.marks
    : -question.negativeMarks;

  const answerEntry = {
    questionId,
    selectedOptionIndex,
    isCorrect,
    marksObtained,
    timeTaken,
  };

  if (existingAnswerIndex >= 0) {
    attempt.answers[existingAnswerIndex] = answerEntry;
  } else {
    attempt.answers.push(answerEntry);
  }

  await attempt.save();
  return { saved: true, isCorrect };
};

export const submitTest = async (attemptId, answersData, studentId) => {
  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    studentId,
    status: "in_progress",
  });

  if (!attempt) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Attempt not found or already submitted");
  }

  // Get all questions for this test
  const questions = await Question.find({ testId: attempt.testId });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  // Process all answers
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

    const isCorrect =
      answer.selectedOptionIndex !== null &&
      question.correctOptionIndex === answer.selectedOptionIndex;

    const marksObtained =
      answer.selectedOptionIndex === null
        ? 0
        : isCorrect
        ? question.marks
        : -question.negativeMarks;

    return {
      questionId: answer.questionId,
      selectedOptionIndex: answer.selectedOptionIndex,
      isCorrect,
      marksObtained,
      timeTaken: answer.timeTaken || 0,
    };
  });

  // Calculate time taken
  attempt.timeTaken = Math.round((Date.now() - attempt.startedAt) / 1000);
  attempt.submittedAt = new Date();
  attempt.status = "evaluated";

  // Calculate result
  attempt.calculateResult();
  await attempt.save();

  return attempt;
};

export const getTestResult = async (attemptId, studentId) => {
  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    studentId,
  }).populate("testId", "title description");

  if (!attempt) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Attempt not found");
  }

  if (attempt.status === "in_progress") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Test not yet submitted");
  }

  // Get questions with correct answers for review
  const questions = await Question.find({ testId: attempt.testId });

  const detailedResult = attempt.answers.map((answer) => {
    const question = questions.find(
      (q) => q._id.toString() === answer.questionId.toString()
    );
    return {
      questionId: answer.questionId,
      questionText: question?.questionText,
      options: question?.options,
      selectedOptionIndex: answer.selectedOptionIndex,
      correctOptionIndex: question?.correctOptionIndex,
      isCorrect: answer.isCorrect,
      marksObtained: answer.marksObtained,
      explanation: question?.explanation,
    };
  });

  return {
    test: attempt.testId,
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
    },
    detailedResult,
  };
};

export const getStudentAttempts = async (studentId) => {
  return TestAttempt.find({ studentId })
    .populate("testId", "title description")
    .sort({ createdAt: -1 });
};

export const getTestLeaderboard = async (testId, limit = 10) => {
  return TestAttempt.find({
    testId,
    status: "evaluated",
  })
    .populate("studentId", "name email")
    .sort({ marksObtained: -1, timeTaken: 1 })
    .limit(limit);
};
