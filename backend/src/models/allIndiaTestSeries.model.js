import mongoose from "mongoose";

// All India Test Series (AITS) — belongs directly to an Exam.
// Tests within AITS are stored in the Test model with type:"aits" and aitsId set.
const aitsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    discountedPrice: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

aitsSchema.index({ examId: 1, order: 1 });
aitsSchema.index({ teacherId: 1, examId: 1 });

aitsSchema.set("toJSON", { virtuals: true });
aitsSchema.set("toObject", { virtuals: true });

export default mongoose.models.AllIndiaTestSeries ||
  mongoose.model("AllIndiaTestSeries", aitsSchema);
