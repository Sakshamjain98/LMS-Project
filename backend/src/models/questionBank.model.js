import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    questionType: { 
      type: String, 
      enum: ["MCQ", "TRUE_FALSE", "MULTIPLE_SELECT"], 
      default: "MCQ" 
    },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    correctOptionIndex: { type: Number, required: true },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    explanation: { type: String, trim: true },
    difficulty: { 
      type: String, 
      enum: ["easy", "medium", "hard"], 
      default: "medium" 
    },
    tags: [String],
    category: String,
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    isPublic: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionBankSchema.index({ createdBy: 1, category: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ difficulty: 1 });

export default mongoose.model("QuestionBank", questionBankSchema);
