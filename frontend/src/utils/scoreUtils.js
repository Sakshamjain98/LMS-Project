export function calculateAccuracy(correctAnswers, attemptedQuestions) {
  if (!attemptedQuestions || attemptedQuestions <= 0) return "0.0";
  return ((correctAnswers / attemptedQuestions) * 100).toFixed(1);
}
