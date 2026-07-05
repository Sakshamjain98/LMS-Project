import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeriesTopic", index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeriesSubject", index: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeriesChapter", index: true },
    // AITS tests: set aitsId instead of chapterId/subjectId/topicId.
    aitsId: { type: mongoose.Schema.Types.ObjectId, ref: "AllIndiaTestSeries", default: null, index: true },
    // "practice" = regular chapter test, "pyq" = past-year question test, "aits" = All India Test Series
    type: { type: String, enum: ["practice", "pyq", "aits"], default: "practice", index: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "closed"],
      default: "draft",
    },
    startTime: Date,
    endTime: Date,
    duration: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    instructions: { type: String, trim: true },
    attemptLimit: { type: Number, default: 0 },
    isProctored: { type: Boolean, default: false },
    isPaid: {
      type: Boolean,
      default: false,
    },

    // Test-time behaviour configuration.
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions:   { type: Boolean, default: false },
    showSolution:     { type: Boolean, default: true },  // show explanations after submit
    allowReview:      { type: Boolean, default: true },  // student can review answers post-submit
    negativeMarking:  { type: Number,  default: 0 },     // marks deducted per wrong answer (0 = none)
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

testSchema.virtual("questionCount").get(function () {
  return this.questions?.length || 0;
});

testSchema.set("toJSON", { virtuals: true });
testSchema.set("toObject", { virtuals: true });

const Test = mongoose.models.Test || mongoose.model("Test", testSchema);

export default Test;