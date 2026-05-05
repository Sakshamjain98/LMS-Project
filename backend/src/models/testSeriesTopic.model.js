import mongoose from "mongoose";

const testSeriesTopicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
