import mongoose from "mongoose";

const examCategorySchema = new mongoose.Schema(
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
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

examCategorySchema.index({ slug: 1 });
examCategorySchema.index({ order: 1 });
examCategorySchema.index({ isVisible: 1, order: 1 });

examCategorySchema.set("toJSON", { virtuals: true });
examCategorySchema.set("toObject", { virtuals: true });

export default mongoose.models.ExamCategory ||
  mongoose.model("ExamCategory", examCategorySchema);
