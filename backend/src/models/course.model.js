import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  fileType: String, // image | pdf | video
});

const videoLinkSchema = new mongoose.Schema({
  url: String,      // YouTube URL
  title: String,
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videos: [videoLinkSchema],
  notes: [fileSchema],
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isPaid: { type: Boolean, default: false },
    tags: [String],
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    thumbnail: fileSchema,
    price: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    sections: [sectionSchema],
  },
  { timestamps: true }
);

courseSchema.index({ isPaid: 1 });
courseSchema.index({ educator: 1 });

export default mongoose.model("Course", courseSchema);