import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    paymentId: {
      type: String,
      required: true,
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
    gst: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    billingPeriod: {
      start: Date,
      end: Date,
    },
    status: {
      type: String,
      enum: ["PAID", "REFUNDED"],
      default: "PAID",
    },
  },
  { timestamps: true }
);

// Auto-generate invoice number
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${Date.now()}-${(count + 1).toString().padStart(6, "0")}`;
  }
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
