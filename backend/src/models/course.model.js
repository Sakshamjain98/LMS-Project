import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true }, // sanitized Quill HTML
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
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
    thumbnail: { url: String, publicId: String },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    order: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

courseSchema.index({ examId: 1, order: 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ teacherId: 1, createdAt: -1 });

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
