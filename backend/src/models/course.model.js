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
    discountedPrice: { type: Number, default: 0, min: 0 },
    // How many months of access a purchase grants. 0 = no expiry (lifetime).
    // For paid courses this drives CourseAccess.expiresAt; after it lapses the
    // student must pay again.
    validityMonths: { type: Number, default: 0, min: 0 },
    // Test series (topics) that are automatically unlocked when this course is
    // purchased. The unlocked TopicAccess rows inherit the course's expiry and
    // are revoked when the course access lapses (source = COURSE_UNLOCK).
    mappedTestSeries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestSeriesTopic",
        index: true,
      },
    ],
    thumbnail: { url: String, publicId: String },
    status: { type: String, enum: ["draft", "published"], default: "published" },
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
