import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseChapter",
      required: true,
      index: true,
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// One record per user-chapter pair.
courseProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });
// Fast lookup of all completed chapters for a user in a course.
courseProgressSchema.index({ userId: 1, courseId: 1 });

export default mongoose.models.CourseProgress ||
  mongoose.model("CourseProgress", courseProgressSchema);
