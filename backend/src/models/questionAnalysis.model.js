import mongoose from "mongoose";

const questionAnalyticsSchema = new mongoose.Schema({
  testId: mongoose.Schema.Types.ObjectId,
  questionId: mongoose.Schema.Types.ObjectId,
  accuracy: Number,   
  avgTime: Number,     
  skipRate: Number,
});

export default mongoose.model(
  "QuestionAnalytics",
  questionAnalyticsSchema
);
