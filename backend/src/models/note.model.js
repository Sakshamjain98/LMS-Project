import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    file: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      fileType: { type: String, default: "pdf" },
    },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isFree: { type: Boolean, default: true }, 
    tags: [String],
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ teacherId: 1, createdAt: -1 });
noteSchema.index({ isFree: 1 });

export default mongoose.model("Note", noteSchema);