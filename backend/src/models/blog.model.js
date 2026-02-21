import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  published: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Blog", blogSchema);
