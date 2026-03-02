import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  fileType: String, 
});

const videoLinkSchema = new mongoose.Schema({
  url: String,   
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
status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);

courseSchema.index({ isPaid: 1 });
courseSchema.index({ educator: 1 });

export default mongoose.model("Course", courseSchema);