import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  name: String,
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  marksPerQuestion: Number,
});

const testConfigSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      unique: true,
      required: true,
    },

    sections: [sectionSchema],
    duration: {
      type: Number, 
      required: true,
    },
    negativeMarking: {
      enabled: Boolean,
      value: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestConfig", testConfigSchema);
