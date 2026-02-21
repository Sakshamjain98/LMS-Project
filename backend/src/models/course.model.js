import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  fileType: String, // "image" | "pdf"
});

const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ["video", "pdf"], required: true },
  title: { type: String, required: true },
  description: String,
  // For video
  videoUrl: String,
  // For pdf (reusing fileSchema fields)
  fileUrl: String,
  filePublicId: String,
  order: { type: Number, default: 0 },
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  items: [itemSchema],
  order: { type: Number, default: 0 },
}, { _id: true });

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isPaid: { type: Boolean, default: false },
    tags: [String],
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    thumbnail: fileSchema, // course image
    price: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    sections: [sectionSchema], // new
  },
  { timestamps: true }
);

courseSchema.index({ isPaid: 1 });
courseSchema.index({ educator: 1 });

export default mongoose.model("Course", courseSchema);