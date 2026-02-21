import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    plan: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "YEARLY"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["CREATED", "SUCCESS", "FAILED", "REFUNDED"],
      default: "CREATED",
    },
    refundedAt: Date,
    refundReason: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
