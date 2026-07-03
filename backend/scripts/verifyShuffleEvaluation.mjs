// Self-check for the shuffle + evaluation logic (backend/src/shared/utils/evaluation.utils.js).
// No DB needed — pure functions. Run: node backend/scripts/verifyShuffleEvaluation.mjs
import assert from "assert";
import {
  shuffleArray,
  buildAttemptQuestionsForStudent,
  toCanonicalOptionIndex,
  calculateMarksForAnswer,
} from "../src/shared/utils/evaluation.utils.js";

// A question whose canonical correct answer is option index 2 ("Paris").
const question = {
  _id: "q1",
  questionText: "Capital of France?",
  options: [{ text: "Berlin" }, { text: "Madrid" }, { text: "Paris" }, { text: "Rome" }],
  correctOptionIndex: 2,
  marks: 4,
  negativeMarks: 1,
};

// 1. shuffleArray produces a permutation, not a mutation of the original, and
//    (with overwhelming probability across many trials) actually reorders.
const original = [0, 1, 2, 3];
let sawDifferentOrder = false;
for (let i = 0; i < 50; i++) {
  const shuffled = shuffleArray(original);
  assert.deepStrictEqual([...shuffled].sort(), original, "shuffle must be a permutation of the input");
  if (JSON.stringify(shuffled) !== JSON.stringify(original)) sawDifferentOrder = true;
}
assert.ok(sawDifferentOrder, "shuffleArray never produced a different order in 50 tries");

// 2. buildAttemptQuestionsForStudent reorders options per the given optionOrder,
//    and never leaks correctOptionIndex to the student payload.
const optionOrder = [2, 0, 3, 1]; // display position -> canonical index
const optionOrders = [{ questionId: "q1", order: optionOrder }];
const [studentQuestion] = buildAttemptQuestionsForStudent([question], ["q1"], optionOrders);
assert.strictEqual(studentQuestion.options[0].text, "Paris", "display position 0 should show the canonical option at index 2");
assert.strictEqual(studentQuestion.options[1].text, "Berlin");
assert.strictEqual(studentQuestion.correctOptionIndex, undefined, "correctOptionIndex must never reach the student");

// 3. A student picking "Paris" at its shuffled display position (0) must be
//    converted back to canonical index 2 and scored as correct.
const canonical = toCanonicalOptionIndex(0, optionOrders, "q1");
assert.strictEqual(canonical, 2);
assert.strictEqual(calculateMarksForAnswer(question, canonical), 4, "correct answer via shuffled option must score +marks");

// 4. A student picking the shuffled-position for "Berlin" (display index 1,
//    canonical index 0) must be scored as wrong (negative marking applied).
const wrongCanonical = toCanonicalOptionIndex(1, optionOrders, "q1");
assert.strictEqual(wrongCanonical, 0);
assert.strictEqual(calculateMarksForAnswer(question, wrongCanonical), -1, "wrong answer must score -negativeMarks");

// 5. Skipped (null) must never be penalized, shuffle or not.
assert.strictEqual(toCanonicalOptionIndex(null, optionOrders, "q1"), null);
assert.strictEqual(calculateMarksForAnswer(question, null), 0, "skipped must score 0");

// 6. Identity fallback: no optionOrders entry (legacy attempt / shuffle off)
//    must pass the index through unchanged.
assert.strictEqual(toCanonicalOptionIndex(2, [], "q1"), 2);

console.log("verifyShuffleEvaluation: all checks passed");
