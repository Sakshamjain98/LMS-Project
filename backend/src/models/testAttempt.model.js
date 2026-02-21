import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  selectedOptionIndex: {
    type: Number,
    default: null, // null means skipped
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  marksObtained: {
    type: Number,
    default: 0,
  },
  timeTaken: {
    type: Number,
    default: 0,
  },
});

const testAttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: [answerSchema],
    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated", "expired"],
      default: "in_progress",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    // Result fields
    totalQuestions: {
      type: Number,
      default: 0,
    },
    attemptedQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    skippedQuestions: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number, // total seconds
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for unique attempt per student per test
testAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });


testAttemptSchema.methods.calculateResult = function () {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let marksObtained = 0;
  this.answers.forEach((answer) => {
    if (answer.selectedOptionIndex === null) {
      skipped++;
    } else if (answer.isCorrect) {
      correct++;
      marksObtained += answer.marksObtained;
    } else {
      wrong++;
      marksObtained += answer.marksObtained;
    }
  });

  this.correctAnswers = correct;
  this.wrongAnswers = wrong;
  this.skippedQuestions = skipped;
  this.attemptedQuestions = correct + wrong;
  this.marksObtained = marksObtained;
  this.percentage = this.totalMarks > 0 
    ? Math.round((marksObtained / this.totalMarks) * 100 * 100) / 100 
    : 0;

  return this;
};

export default mongoose.model("TestAttempt", testAttemptSchema);
