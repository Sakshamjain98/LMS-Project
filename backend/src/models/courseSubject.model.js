import mongoose from "mongoose";

const courseSubjectSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
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
  },
  { timestamps: true }
);

courseSubjectSchema.index({ courseId: 1, order: 1 });

courseSubjectSchema.set("toJSON", { virtuals: true });
courseSubjectSchema.set("toObject", { virtuals: true });

export default mongoose.models.CourseSubject ||
  mongoose.model("CourseSubject", courseSubjectSchema);
