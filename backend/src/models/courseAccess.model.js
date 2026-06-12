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
    // null = does not expire on its own (still subject to platform subscription
    // / admin disable); a date = time-bound grant.
    expiresAt: { type: Date, default: null },
    // Admin can disable a single course grant without deleting the record, so
    // the user keeps their progress and must repay to regain access.
    disabled: { type: Boolean, default: false },
    disabledAt: { type: Date, default: null },
    // Cron-maintained stored status for admin reporting/filtering. Real-time
    // access still relies on expiresAt/disabled.
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// A user can only access a course once.
courseAccessSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.models.CourseAccess ||
  mongoose.model("CourseAccess", courseAccessSchema);
