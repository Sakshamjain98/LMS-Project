import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "closed"],
      default: "draft",
    },
    startTime: Date,
    endTime: Date,
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    instructions: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Virtual for question count
testSchema.virtual("questionCount").get(function () {
  return this.questions?.length || 0;
});

// Ensure virtuals are included in JSON
testSchema.set("toJSON", { virtuals: true });
testSchema.set("toObject", { virtuals: true });

export default mongoose.model("Test", testSchema);
