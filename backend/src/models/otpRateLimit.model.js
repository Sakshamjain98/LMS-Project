import mongoose from 'mongoose';

const otpRateLimitSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  attempts: {
    type: Number,
    default: 1,
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('OtpRateLimit', otpRateLimitSchema);