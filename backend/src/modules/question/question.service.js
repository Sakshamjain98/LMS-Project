import Question from "../../models/question.model.js";
import Test from "../test/test.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";

export const createQuestion = async (testId, questionData, teacherId) => {
  // Verify test exists and belongs to teacher
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found or unauthorized");
  }

  // Mark correct option
  const options = questionData.options.map((opt, index) => ({
    text: opt.text,
    isCorrect: index === questionData.correctOptionIndex,
  }));

  const question = await Question.create({
    ...questionData,
    testId,
    options,
    createdBy: teacherId,
  });

  // Add question to test
  await Test.findByIdAndUpdate(testId, {
    $push: { questions: question._id },
  });

  return question;
};

export const bulkCreateQuestions = async (testId, questions, teacherId) => {
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found or unauthorized");
  }

  const createdQuestions = await Promise.all(
    questions.map(async (q) => {
      const options = q.options.map((opt, index) => ({
        text: opt.text,
        isCorrect: index === q.correctOptionIndex,
      }));

      return Question.create({
        ...q,
        testId,
        options,
        createdBy: teacherId,
      });
    })
  );

  // Add all questions to test
  await Test.findByIdAndUpdate(testId, {
    $push: { questions: { $each: createdQuestions.map((q) => q._id) } },
  });

  return createdQuestions;
};

export const getQuestionsByTest = async (testId, teacherId) => {
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found or unauthorized");
  }

  return Question.find({ testId }).sort({ createdAt: 1 });
};

export const getQuestionById = async (questionId, teacherId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  // Verify ownership
  const test = await Test.findOne({ _id: question.testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized");
  }

  return question;
};

export const updateQuestion = async (questionId, updateData, teacherId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  const test = await Test.findOne({ _id: question.testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized");
  }

  // If options or correctOptionIndex changed, update isCorrect flags
  if (updateData.options && updateData.correctOptionIndex !== undefined) {
    updateData.options = updateData.options.map((opt, index) => ({
      text: opt.text,
      isCorrect: index === updateData.correctOptionIndex,
    }));
  }

  return Question.findByIdAndUpdate(questionId, updateData, { new: true });
};

export const deleteQuestion = async (questionId, teacherId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  const test = await Test.findOne({ _id: question.testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized");
  }

  // Remove from test
  await Test.findByIdAndUpdate(question.testId, {
    $pull: { questions: questionId },
  });

  await Question.findByIdAndDelete(questionId);
  return { deleted: true };
};
