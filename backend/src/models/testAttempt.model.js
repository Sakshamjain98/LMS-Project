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
    autoSubmitted: {
      type: Boolean,
      default: false,
      index: true,
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

// NOTE: students may have multiple attempts at the same test (attemptLimit allows
// 0 = unlimited). DO NOT add a unique index on (testId, studentId) here.
// The individual `testId` and `studentId` indexes above are sufficient.
testAttemptSchema.index({ testId: 1, status: 1 });
testAttemptSchema.index({ studentId: 1, status: 1 });
testAttemptSchema.index({ marksObtained: -1, timeTaken: 1 });

const TestAttempt = mongoose.model("TestAttempt", testAttemptSchema);

// Self-heal: an earlier version of this schema had a UNIQUE compound index on
// (testId, studentId). MongoDB keeps that index even after the schema changes,
// which makes the second attempt fail with E11000. Drop it once at startup.
const dropStaleUniqueIndex = async () => {
  try {
    const indexes = await TestAttempt.collection.indexes();
    const stale = indexes.find(
      (idx) =>
        idx.name === "testId_1_studentId_1" ||
        (idx.unique && idx.key && idx.key.testId === 1 && idx.key.studentId === 1)
    );
    if (stale) {
      await TestAttempt.collection.dropIndex(stale.name);
      console.log(`[testAttempt] dropped stale unique index '${stale.name}'`);
    }
  } catch (err) {
    if (err?.codeName !== "IndexNotFound") {
      console.warn("[testAttempt] index cleanup skipped:", err.message);
    }
  }
};

mongoose.connection.once("open", () => {
  dropStaleUniqueIndex();
});
if (mongoose.connection.readyState === 1) {
  dropStaleUniqueIndex();
}

export default TestAttempt;
