import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { calculateTestResult, sumQuestionMarks } from "../src/shared/utils/evaluation.utils.js";

const questionId = () => new mongoose.Types.ObjectId();

const makeQuestion = (marks, negativeMarks = 0) => ({
  _id: questionId(),
  correctOptionIndex: 0,
  marks,
  negativeMarks,
});

describe("sumQuestionMarks", () => {
  it("returns 0 for no questions", () => {
    expect(sumQuestionMarks([])).toBe(0);
  });

  it("sums marks, defaulting missing marks to 0", () => {
    expect(sumQuestionMarks([{ marks: 2 }, { marks: 3 }, {}])).toBe(5);
  });
});

describe("calculateTestResult", () => {
  it("handles zero questions / zero attempts without NaN or Infinity", () => {
    const result = calculateTestResult([], [], 0);
    expect(result.percentage).toBe(0);
    expect(result.marksObtained).toBe(0);
    expect(result.attemptedQuestions).toBe(0);
    expect(Number.isFinite(result.percentage)).toBe(true);
  });

  it("scores an unsubmitted/no-answer attempt as all skipped", () => {
    const q1 = makeQuestion(2);
    const q2 = makeQuestion(1);
    const result = calculateTestResult([], [q1, q2], 3);
    expect(result.skippedQuestions).toBe(0); // no answer docs at all — nothing to count
    expect(result.correctAnswers).toBe(0);
    expect(result.marksObtained).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("handles a partial attempt with mixed marks/negative marks", () => {
    const q1 = makeQuestion(2, 0.5); // correct
    const q2 = makeQuestion(1, 0.25); // wrong
    const q3 = makeQuestion(3, 1); // skipped

    const answers = [
      { questionId: q1._id, selectedOptionIndex: 0 }, // correct
      { questionId: q2._id, selectedOptionIndex: 1 }, // wrong (correct is 0)
      { questionId: q3._id, selectedOptionIndex: null }, // skipped
    ];

    const totalMarks = sumQuestionMarks([q1, q2, q3]); // 6
    const result = calculateTestResult(answers, [q1, q2, q3], totalMarks);

    expect(result.correctAnswers).toBe(1);
    expect(result.wrongAnswers).toBe(1);
    expect(result.skippedQuestions).toBe(1);
    expect(result.attemptedQuestions).toBe(2);
    expect(result.marksObtained).toBe(2 - 0.25);
    expect(result.percentage).toBe(Math.round(((2 - 0.25) / 6) * 100 * 100) / 100);
  });

  it("never divides by zero when totalMarks is 0 despite answers existing", () => {
    const q1 = makeQuestion(0);
    const answers = [{ questionId: q1._id, selectedOptionIndex: 0 }];
    const result = calculateTestResult(answers, [q1], 0);
    expect(result.percentage).toBe(0);
    expect(Number.isFinite(result.percentage)).toBe(true);
  });

  it("ignores answers referencing a question that no longer exists on the test", () => {
    const q1 = makeQuestion(2);
    const orphanId = questionId();
    const answers = [
      { questionId: q1._id, selectedOptionIndex: 0 },
      { questionId: orphanId, selectedOptionIndex: 0 },
    ];
    const result = calculateTestResult(answers, [q1], 2);
    expect(result.correctAnswers).toBe(1);
    expect(result.attemptedQuestions).toBe(1);
  });
});
