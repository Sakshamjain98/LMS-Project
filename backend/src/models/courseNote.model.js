import mongoose from "mongoose";

const courseNoteSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseChapter",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    // "rich_text" = Quill HTML stored in `content`
    // "pdf" = Cloudinary upload stored in fileUrl / filePublicId
    type: { type: String, enum: ["rich_text", "pdf"], required: true },
    content: { type: String }, // sanitized Quill HTML (rich_text only)
    fileUrl: { type: String }, // Cloudinary secure URL (pdf only)
    filePublicId: { type: String }, // Cloudinary public_id (pdf only)
    fileName: { type: String }, // original filename (pdf only)
    allowDownload: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

courseNoteSchema.index({ chapterId: 1, order: 1 });

courseNoteSchema.set("toJSON", { virtuals: true });
courseNoteSchema.set("toObject", { virtuals: true });

export default mongoose.models.CourseNote ||
  mongoose.model("CourseNote", courseNoteSchema);
