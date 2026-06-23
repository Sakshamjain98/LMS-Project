/**
 * Shared evaluation utilities for test attempts
 */

/**
 * Calculate marks for a single answer
 */
export const calculateMarksForAnswer = (question, selectedOptionIndex) => {
  if (selectedOptionIndex === null) {
    return 0; // Skipped
  }

  const isCorrect = question.correctOptionIndex === selectedOptionIndex;
  return isCorrect ? question.marks : -question.negativeMarks;
};

/**
 * Check if answer is correct
 */
export const isAnswerCorrect = (question, selectedOptionIndex) => {
  return selectedOptionIndex !== null && question.correctOptionIndex === selectedOptionIndex;
};

/**
 * Calculate comprehensive test result from answers
 */
export const calculateTestResult = (answers, questions, totalMarks) => {
  const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let marksObtained = 0;

  answers.forEach(answer => {
    const question = questionMap.get(answer.questionId.toString());
    if (!question) return;

    if (answer.selectedOptionIndex === null) {
      skipped++;
    } else {
      const isCorrect = question.correctOptionIndex === answer.selectedOptionIndex;
      if (isCorrect) {
        correct++;
        marksObtained += question.marks;
      } else {
        wrong++;
        marksObtained -= question.negativeMarks;
      }
    }
  });

  const attempted = correct + wrong;
  const percentage = totalMarks > 0 
    ? Math.round((marksObtained / totalMarks) * 100 * 100) / 100 
    : 0;

  return {
    correctAnswers: correct,
    wrongAnswers: wrong,
    attemptedQuestions: attempted,
    skippedQuestions: skipped,
    marksObtained,
    percentage,
  };
};

/**
 * Sanitize questions for student (remove correct answers)
 */
export const sanitizeQuestionsForStudent = (questions) => {
  return questions.map(q => {
    const sanitized = q.toObject ? q.toObject() : q;
    delete sanitized.correctOptionIndex;
    sanitized.options = sanitized.options.map(opt => ({
      text: opt.text,
    }));
    delete sanitized.explanation;
    return sanitized;
  });
};

/**
 * Validate test timing constraints
 */
export const validateTestTiming = (test, currentTime = Date.now()) => {
  if (test.status !== "published") {
    return { valid: false, reason: "Test is not published" };
  }

  if (test.startTime && new Date(test.startTime) > currentTime) {
    return { valid: false, reason: "Test has not started yet" };
  }

  if (test.endTime && new Date(test.endTime) < currentTime) {
    return { valid: false, reason: "Test has ended" };
  }

  return { valid: true };
};

/**
 * Check if attempt has exceeded time limit
 */
export const hasExceededTimeLimit = (attempt, test) => {
  const elapsedSeconds = (Date.now() - attempt.startedAt) / 1000;
  return elapsedSeconds > test.duration * 60;
};

/**
 * Generate detailed result with solutions
 */
export const generateDetailedResult = (attempt, questions) => {
  const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

  return attempt.answers.map(answer => {
    const question = questionMap.get(answer.questionId.toString());
    if (!question) return null;

    return {
      questionId: question._id,
      questionText: question.questionText,
      imageUrl: question.imageUrl || "",
      questionType: question.questionType,
      options: question.options,
      selectedOptionIndex: answer.selectedOptionIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect: answer.isCorrect,
      marksObtained: answer.marksObtained,
      explanation: question.explanation || "No explanation available",
      difficulty: question.difficulty,
    };
  }).filter(Boolean);
};
