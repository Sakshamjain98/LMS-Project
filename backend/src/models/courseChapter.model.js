import mongoose from "mongoose";

const linkedTestSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const courseChapterSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseSubject",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true }, // Quill HTML
    order: { type: Number, default: 0 },
    linkedTests: [linkedTestSchema],
  },
  { timestamps: true }
);

courseChapterSchema.index({ subjectId: 1, order: 1 });

courseChapterSchema.set("toJSON", { virtuals: true });
courseChapterSchema.set("toObject", { virtuals: true });

export default mongoose.models.CourseChapter ||
  mongoose.model("CourseChapter", courseChapterSchema);
