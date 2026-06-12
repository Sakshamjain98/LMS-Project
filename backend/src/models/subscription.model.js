import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
      required: true,
    },
    plan: {
      type: String,
      enum: ["FREE", "MONTHLY", "QUARTERLY", "YEARLY"],
      default: "FREE",
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"],
      default: "ACTIVE",
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    renewalReminder: {
      type: Boolean,
      default: true,
    },
    paymentHistory: [
      {
        paymentId: String,
        amount: Number,
        paidAt: Date,
        plan: String,
      },
    ],
    // --- Admin access management ---
    // When an admin disables a user's premium access, we set status=CANCELLED
    // and record who/why. The account & all history are preserved; the user
    // must repay to reactivate.
    disabledAt: { type: Date, default: null },
    disabledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    disabledReason: { type: String, default: null },
    lastExtendedAt: { type: Date, default: null },
    source: {
      type: String,
      enum: ["PAYMENT", "ADMIN_GRANT", "MIGRATION", "FREE"],
      default: "PAYMENT",
    },
  },
  { timestamps: true }
);

// Virtual to check if subscription is active
subscriptionSchema.virtual("isActive").get(function () {
  if (this.plan === "FREE") return true;
  return this.status === "ACTIVE" && this.endDate > new Date();
});

// Method to check days remaining
subscriptionSchema.methods.daysRemaining = function () {
  if (this.plan === "FREE") return Infinity;
  if (!this.endDate) return 0;
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Pre-save: auto-expire if endDate passed.
// Mongoose 9 uses synchronous/promise-style middleware — a hook that takes no
// `next` argument runs synchronously, so we must NOT call next() here.
subscriptionSchema.pre("save", function () {
  if (this.endDate && this.endDate < new Date() && this.status === "ACTIVE") {
    this.status = "EXPIRED";
  }
});

// Index for expiry queries
subscriptionSchema.index({ endDate: 1, status: 1 });

export default mongoose.model("Subscription", subscriptionSchema);


