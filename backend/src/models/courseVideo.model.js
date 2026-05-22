import mongoose from "mongoose";

// Extracts a YouTube video ID from a variety of URL formats.
function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

const courseVideoSchema = new mongoose.Schema(
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
    youtubeUrl: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

courseVideoSchema.virtual("youtubeId").get(function () {
  return extractYouTubeId(this.youtubeUrl);
});

courseVideoSchema.index({ chapterId: 1, order: 1 });

courseVideoSchema.set("toJSON", { virtuals: true });
courseVideoSchema.set("toObject", { virtuals: true });

export default mongoose.models.CourseVideo ||
  mongoose.model("CourseVideo", courseVideoSchema);
