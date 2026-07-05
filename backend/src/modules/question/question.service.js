import Question from "../../models/question.model.js";
import Test from "../../models/test.model.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { sumQuestionMarks } from "../../shared/utils/evaluation.utils.js";

/**
 * Recompute Test.totalMarks from its live questions. Call this after any
 * question create/update/delete so totalMarks never drifts from the
 * questions that actually make up the test (it used to only be
 * incremented on create, never adjusted on edit/delete).
 */
export const recalculateTestTotalMarks = async (testId) => {
  const questions = await Question.find({ testId }).select("marks").lean();
  const totalMarks = sumQuestionMarks(questions);
  await Test.findByIdAndUpdate(testId, { totalMarks });
  return totalMarks;
};

const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();

/**
 * Validate question data and options
 */
const validateQuestionData = (questionData) => {
  const { questionType, options, correctOptionIndex } = questionData;

  if (!stripHtml(questionData?.questionText || "")) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Question text is required");
  }

  // Validate options array is not empty
  if (!Array.isArray(options) || options.length === 0) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Options array is required and must contain at least 2 options"
    );
  }

  // Validate option count by type
  const expectedCount = {
    MCQ: 4,
    TRUE_FALSE: 2,
    MULTIPLE_SELECT: null, // No strict count for MULTIPLE_SELECT
  };

  if (expectedCount[questionType]) {
    if (options.length !== expectedCount[questionType]) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `${questionType} must have exactly ${expectedCount[questionType]} options. Got ${options.length}`
      );
    }
  }

  // Validate correctOptionIndex
  if (
    !Number.isInteger(correctOptionIndex) ||
    correctOptionIndex < 0 ||
    correctOptionIndex >= options.length
  ) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `Correct option index must be between 0 and ${options.length - 1}`
    );
  }

  // Validate that each option has text
  for (let i = 0; i < options.length; i++) {
    if (!options[i].text || typeof options[i].text !== "string") {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Option ${i + 1} must have valid text`
      );
    }
  }

  return true;
};

/**
 * Format options with isCorrect flag
 */
const formatOptions = (options, correctOptionIndex) => {
  return options.map((opt, index) => ({
    text: opt.text.trim(),
    isCorrect: index === correctOptionIndex,
  }));
};

/**
 * Create a single question and link to test
 */
export const createQuestion = async (testId, questionData, teacherId) => {
  // Validate test exists and belongs to teacher
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or unauthorized"
    );
  }

  // Validate question data structure
  validateQuestionData(questionData);

  // Format options with correct flags
  const formattedOptions = formatOptions(
    questionData.options,
    questionData.correctOptionIndex
  );

  // Create question
  const question = await Question.create({
    questionText: questionData.questionText.trim(),
    imageUrl: questionData.imageUrl?.trim() || "",
    questionType: questionData.questionType || "MCQ",
    options: formattedOptions,
    correctOptionIndex: questionData.correctOptionIndex,
    marks: questionData.marks || 1,
    negativeMarks: questionData.negativeMarks || 0,
    explanation: questionData.explanation?.trim() || "",
    difficulty: questionData.difficulty || "medium",
    tags: questionData.tags || [],
    testId,
    createdBy: teacherId,
  });

  // Link question to test
  await linkQuestionsToTest(testId, [question._id]);
  await recalculateTestTotalMarks(testId);

  return question;
};

/**
 * Bulk create questions and link to test
 */
export const bulkCreateQuestions = async (
  testId,
  questionsArray,
  teacherId
) => {
  // Validate test exists and belongs to teacher
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or unauthorized"
    );
  }

  if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Questions array is required and must not be empty"
    );
  }

  // Validate each question
  for (let i = 0; i < questionsArray.length; i++) {
    try {
      validateQuestionData(questionsArray[i]);
    } catch (err) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        `Question ${i + 1}: ${err.message}`
      );
    }
  }

  // Format all questions
  const formattedQuestions = questionsArray.map((q) => ({
    questionText: q.questionText.trim(),
    imageUrl: q.imageUrl?.trim() || "",
    questionType: q.questionType || "MCQ",
    options: formatOptions(q.options, q.correctOptionIndex),
    correctOptionIndex: q.correctOptionIndex,
    marks: q.marks || 1,
    negativeMarks: q.negativeMarks || 0,
    explanation: q.explanation?.trim() || "",
    difficulty: q.difficulty || "medium",
    tags: q.tags || [],
    testId,
    createdBy: teacherId,
  }));

  // Insert all at once
  const createdQuestions = await Question.insertMany(formattedQuestions);

  // Link all to test
  await linkQuestionsToTest(
    testId,
    createdQuestions.map((q) => q._id)
  );
  await recalculateTestTotalMarks(testId);

  return createdQuestions;
};

/**
 * Link questions to test (reusable utility)
 */
export const linkQuestionsToTest = async (testId, questionIds) => {
  if (!Array.isArray(questionIds) || questionIds.length === 0) return;

  const result = await Test.findByIdAndUpdate(
    testId,
    {
      $addToSet: { questions: { $each: questionIds } },
    },
    { new: true }
  );

  if (!result) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  }

  return result;
};

/**
 * Get all questions for a test
 */
export const getQuestionsByTest = async (testId, teacherId) => {
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or unauthorized"
    );
  }

  return Question.find({ testId })
    .sort({ createdAt: 1 })
    .lean();
};

/**
 * Get question by ID (with ownership verification)
 */
export const getQuestionById = async (questionId, teacherId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  const test = await Test.findOne({ _id: question.testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized");
  }

  return question;
};

/**
 * Update question
 */
export const updateQuestion = async (questionId, updateData, teacherId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Question not found");
  }

  const test = await Test.findOne({ _id: question.testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Unauthorized");
  }

  // If options or correctOptionIndex changed, validate and reformat
  if (updateData.options !== undefined || updateData.correctOptionIndex !== undefined) {
    const mergedData = {
      questionType: updateData.questionType || question.questionType,
      options: updateData.options !== undefined ? updateData.options : question.options,
      correctOptionIndex: updateData.correctOptionIndex !== undefined ? updateData.correctOptionIndex : question.correctOptionIndex,
      questionText: updateData.questionText !== undefined ? updateData.questionText : question.questionText,
    };

    validateQuestionData(mergedData);

    updateData.options = formatOptions(
      mergedData.options,
      mergedData.correctOptionIndex
    );
  }

  // Trim string fields
  if (updateData.questionText) {
    updateData.questionText = updateData.questionText.trim();
    if (!stripHtml(updateData.questionText)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Question text is required");
    }
  }
  if (updateData.explanation) {
    updateData.explanation = updateData.explanation.trim();
  }
  if (updateData.imageUrl !== undefined) {
    updateData.imageUrl = updateData.imageUrl?.trim?.() || "";
  }

  const updated = await Question.findByIdAndUpdate(questionId, updateData, { new: true });
  if (updateData.marks !== undefined) {
    await recalculateTestTotalMarks(question.testId);
  }
  return updated;
};

/**
 * Delete question and unlink from test
 */
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

  // Delete question
  await Question.findByIdAndDelete(questionId);
  await recalculateTestTotalMarks(question.testId);

  return { deleted: true };
};

/**
 * Import questions from question bank
 */
export const importQuestionsFromBank = async (
  testId,
  bankQuestionIds,
  teacherId
) => {
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Test not found");
  }

  const bankQuestions = await Question.find({ _id: { $in: bankQuestionIds } });

  if (bankQuestions.length !== bankQuestionIds.length) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "One or more questions not found in question bank"
    );
  }

  // Clone questions for this test
  const clonedQuestions = bankQuestions.map((q) => ({
    ...q.toObject(),
    _id: undefined,
    testId,
    createdBy: teacherId,
  }));

  const created = await Question.insertMany(clonedQuestions);
  await linkQuestionsToTest(
    testId,
    created.map((q) => q._id)
  );
  await recalculateTestTotalMarks(testId);

  return created;
};

/**
 * Get questions with full details (teacher view)
 */
export const getQuestionsWithDetails = async (testId, teacherId) => {
  const test = await Test.findOne({ _id: testId, teacherId });
  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or unauthorized"
    );
  }

  return Question.find({ testId }).sort({ createdAt: 1 }).lean();
};
