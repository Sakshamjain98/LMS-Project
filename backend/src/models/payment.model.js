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
    },
    // Distinguishes what was purchased. Historical rows predate this field and
    // are all subscriptions — "SUBSCRIPTION" is the correct default for them.
    kind: {
      type: String,
      enum: ["SUBSCRIPTION", "COURSE", "TOPIC"],
      default: "SUBSCRIPTION",
    },
    // Course/topic id when kind is COURSE/TOPIC; null for subscriptions.
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      default: "",
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
      enum: ["PENDING", "PENDING_APPROVAL", "SUCCESS", "FAILED", "REFUNDED", "REJECTED"],
      default: "PENDING",
    },
    refundedAt: Date,
    refundReason: String,
    adminApproved: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

