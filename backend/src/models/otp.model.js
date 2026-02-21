import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: document auto-deletes after this time
    },
    attempts: {
        type: Number,
        default: 0,
      }      
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
