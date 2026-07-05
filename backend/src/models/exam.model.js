import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    examCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamCategory",
      required: true,
      index: true,
    },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

examSchema.index({ examCategoryId: 1, order: 1 });
examSchema.index({ slug: 1 });

examSchema.set("toJSON", { virtuals: true });
examSchema.set("toObject", { virtuals: true });

export default mongoose.models.Exam || mongoose.model("Exam", examSchema);
