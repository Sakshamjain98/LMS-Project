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
 * Sum of a test's live questions' marks — the correct value for Test.totalMarks.
 * Pure so it can be unit tested without touching the DB.
 */
export const sumQuestionMarks = (questions) => {
  return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
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
 * Fisher-Yates shuffle. Not cryptographic — question/option order isn't a
 * secret, it just needs to differ per attempt.
 */
export const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Reorders questions per questionOrder and each question's options per its
 * matching optionOrders entry, then sanitizes. Falls back to identity order
 * when questionOrder/optionOrders are missing or empty — this makes it safe
 * for attempts created before shuffle support shipped (no data migration).
 */
export const buildAttemptQuestionsForStudent = (questions, questionOrder, optionOrders) => {
  const qMap = new Map(questions.map((q) => [q._id.toString(), q]));
  const orderMap = new Map((optionOrders || []).map((o) => [o.questionId.toString(), o.order]));

  const ids = questionOrder && questionOrder.length ? questionOrder : questions.map((q) => q._id);
  const ordered = ids.map((id) => qMap.get(id.toString())).filter(Boolean);

  const reordered = ordered.map((q) => {
    const base = q.toObject ? q.toObject() : q;
    const order = orderMap.get(base._id.toString()) || base.options.map((_, i) => i);
    return { ...base, options: order.map((canonicalIdx) => base.options[canonicalIdx]) };
  });

  return sanitizeQuestionsForStudent(reordered);
};

/**
 * selectedOptionIndex arrives from the client in display (shuffled)
 * coordinates. Converts it to the canonical index question.correctOptionIndex
 * is defined against. Identity fallback covers unshuffled tests and legacy
 * attempts with no optionOrders.
 */
export const toCanonicalOptionIndex = (selectedOptionIndex, optionOrders, questionId) => {
  if (selectedOptionIndex === null || selectedOptionIndex === undefined) return null;
  const entry = (optionOrders || []).find((o) => o.questionId.toString() === questionId.toString());
  const order = entry?.order;
  return order && order[selectedOptionIndex] !== undefined ? order[selectedOptionIndex] : selectedOptionIndex;
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
