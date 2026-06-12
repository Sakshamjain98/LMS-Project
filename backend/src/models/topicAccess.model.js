import mongoose from "mongoose";

// Records a successful one-time unlock of a paid test series (topic) by a user.
// Existence of a document means the user has access to every test in that topic.
const topicAccessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSeriesTopic",
      required: true,
      index: true,
    },
    // Optional: COURSE_UNLOCK rows have no Razorpay order of their own.
    orderId: { type: String, default: null, index: true },
    paymentId: { type: String },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    // When the unlock expires. null = no expiry (lifetime). After this passes
    // the user loses access and must repay.
    expiresAt: { type: Date, default: null },
    // Admin can revoke a one-time unlock without deleting the record, so the
    // user keeps their history and must repay to regain access.
    disabled: { type: Boolean, default: false },
    disabledAt: { type: Date, default: null },
    // How the access was obtained:
    //   DIRECT_PURCHASE — student bought this series directly (independent validity).
    //   COURSE_UNLOCK   — auto-unlocked by purchasing a mapped course; inherits the
    //                     course's expiry and is revoked when the course lapses.
    source: {
      type: String,
      enum: ["DIRECT_PURCHASE", "COURSE_UNLOCK"],
      default: "DIRECT_PURCHASE",
    },
    // Set when source = COURSE_UNLOCK — the course this unlock came from.
    sourceCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    // Cron-maintained stored status for admin reporting/filtering. Real-time
    // access still relies on expiresAt/disabled, so correctness never depends
    // on the cron having run.
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

topicAccessSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export default mongoose.models.TopicAccess ||
  mongoose.model("TopicAccess", topicAccessSchema);
