
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  approved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);