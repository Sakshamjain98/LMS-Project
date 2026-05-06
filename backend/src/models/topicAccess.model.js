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
    orderId: { type: String, required: true, index: true },
    paymentId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

topicAccessSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export default mongoose.models.TopicAccess ||
  mongoose.model("TopicAccess", topicAccessSchema);
