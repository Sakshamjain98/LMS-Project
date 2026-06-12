import mongoose from "mongoose";

const testSeriesTopicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Optional parent exam — set when a test series belongs to a structured exam hierarchy.
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", default: null, index: true },
    // Pricing lives on the test series (topic), not on the individual test.
    // A topic is either free for all students or sold as a single bundle at `price`.
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    discountedPrice: { type: Number, default: 0, min: 0 },
    // Months of access a purchase grants. 0 = no expiry (lifetime). Drives
    // TopicAccess.expiresAt; after it lapses the student must pay again.
    validityMonths: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

testSeriesTopicSchema.index({ teacherId: 1, createdAt: -1 });

testSeriesTopicSchema.set("toJSON", { virtuals: true });
testSeriesTopicSchema.set("toObject", { virtuals: true });

const TestSeriesTopic =
  mongoose.models.TestSeriesTopic ||
  mongoose.model("TestSeriesTopic", testSeriesTopicSchema);

export default TestSeriesTopic;
