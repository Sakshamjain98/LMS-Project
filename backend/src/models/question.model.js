import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, default: false },
});

const questionSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    questionText: { type: String, required: true, trim: true },
    questionType: { type: String, enum: ["MCQ", "TRUE_FALSE", "MULTIPLE_SELECT"], default: "MCQ" },
    options: {
      type: [optionSchema],
      validate: {
        validator: function (options) {
          if (this.questionType === "MCQ") return options.length === 4;
          if (this.questionType === "TRUE_FALSE") return options.length === 2;
          return options.length >= 2;
        },
        message: "MCQ must have exactly 4 options, TRUE_FALSE must have 2",
      },
    },
    correctOptionIndex: { type: Number, required: true, min: 0 },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    explanation: { type: String, trim: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    tags: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

questionSchema.index({ testId: 1, createdAt: 1 });

questionSchema.virtual("correctOption").get(function () {
  return this.options[this.correctOptionIndex];
});

questionSchema.methods.isAnswerCorrect = function (selectedOptionIndex) {
  return this.correctOptionIndex === selectedOptionIndex;
};

export default mongoose.model("Question", questionSchema);