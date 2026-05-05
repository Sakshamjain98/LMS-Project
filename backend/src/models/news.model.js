import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    summary: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    published: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("News", newsSchema);
