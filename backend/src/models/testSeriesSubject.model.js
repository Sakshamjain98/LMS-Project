import mongoose from "mongoose";

const testSeriesSubjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSeriesTopic",
      required: true,
      index: true,
    },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

testSeriesSubjectSchema.index({ topicId: 1, order: 1 });

testSeriesSubjectSchema.set("toJSON", { virtuals: true });
testSeriesSubjectSchema.set("toObject", { virtuals: true });

const TestSeriesSubject =
  mongoose.models.TestSeriesSubject ||
  mongoose.model("TestSeriesSubject", testSeriesSubjectSchema);

export default TestSeriesSubject;
