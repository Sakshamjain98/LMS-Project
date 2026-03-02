import mongoose from "mongoose";

const questionAnalyticsSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  totalAttempts: { type: Number, default: 0 },
  correctAttempts: { type: Number, default: 0 },
  incorrectAttempts: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  avgTimeSpent: { type: Number, default: 0 }, 
}, { timestamps: true });

export default mongoose.model("QuestionAnalytics", questionAnalyticsSchema);