import mongoose from "mongoose";

const courseAccessSchema = new mongoose.Schema(
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
    paymentId: { type: String, default: null },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// A user can only access a course once.
courseAccessSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.models.CourseAccess ||
  mongoose.model("CourseAccess", courseAccessSchema);
