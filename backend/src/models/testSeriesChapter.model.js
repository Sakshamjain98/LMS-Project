import mongoose from "mongoose";

const testSeriesChapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSeriesSubject",
      required: true,
      index: true,
    },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

testSeriesChapterSchema.index({ subjectId: 1, createdAt: 1 });

testSeriesChapterSchema.set("toJSON", { virtuals: true });
testSeriesChapterSchema.set("toObject", { virtuals: true });

const TestSeriesChapter =
  mongoose.models.TestSeriesChapter ||
  mongoose.model("TestSeriesChapter", testSeriesChapterSchema);

export default TestSeriesChapter;
