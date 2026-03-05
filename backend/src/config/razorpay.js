import Razorpay from "razorpay";

let razorpay = null;

if (process.env.PAYMENT_MODE !== "DEV") {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    process.exit(1);
  }
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("⚠️  PAYMENT_MODE=DEV — Razorpay SDK is disabled. Real orders will NOT be created.");
}

export { razorpay };