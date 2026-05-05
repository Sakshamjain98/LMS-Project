import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeriesTopic", index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeriesSubject", index: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeriesChapter", index: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    status: { type: String, enum: ["draft", "scheduled", "published", "closed"], default: "draft" },
    startTime: Date,
    endTime: Date,
    duration: { type: Number, default: 60 }, // minutes
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    instructions: { type: String, trim: true },
    attemptLimit: { type: Number, default: 0 },
    isProctored: { type: Boolean, default: false },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

testSchema.virtual("questionCount").get(function () {
  return this.questions?.length || 0;
});

testSchema.set("toJSON", { virtuals: true });
testSchema.set("toObject", { virtuals: true });

export default mongoose.model("Test", testSchema);