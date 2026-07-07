import cron from "node-cron";
import Payment from "../../models/payment.model.js";
import { razorpay } from "../../config/razorpay.js";
import { reconcilePayment } from "../../modules/payment/payment.service.js";
import logger from "../logger/logger.js";

/**
 * Safety net for payments captured at Razorpay but never fulfilled locally —
 * e.g. the checkout `handler` callback never fired (tab closed, in-app-browser
 * app-switch for UPI) and the webhook missed it too. Finds every PENDING
 * order, asks Razorpay if it's actually paid, and fulfills it if so. Reuses
 * the same idempotent `reconcilePayment` the admin recovery endpoint uses.
 */
export const runPaymentReconcileSweep = async ({ dryRun = false } = {}) => {
  if (!razorpay) return { skipped: "PAYMENT_MODE=DEV" };

  const pending = await Payment.find({ status: "PENDING" }).select("orderId").lean();
  const real = pending.filter((p) => !p.orderId.startsWith("dev_"));

  const summary = { checked: real.length, fulfilled: 0, stillPending: 0, errors: 0 };

  for (const p of real) {
    try {
      if (dryRun) {
        const order = await razorpay.orders.fetch(p.orderId);
        if (order?.status === "paid") summary.fulfilled++; // "would fulfill"
        else summary.stillPending++;
        continue;
      }
      await reconcilePayment({ orderId: p.orderId });
      summary.fulfilled++;
    } catch (err) {
      if (/not paid yet/.test(err.message)) {
        summary.stillPending++;
      } else {
        summary.errors++;
        logger.error("Payment reconcile sweep: failed on one order", { orderId: p.orderId, error: err.message });
      }
    }
  }

  if (summary.fulfilled > 0) {
    logger.warn("Payment reconcile sweep found paid-but-unfulfilled orders", summary);
  } else {
    logger.info("Payment reconcile sweep complete", summary);
  }
  return summary;
};

/** Schedule the recurring sweep (every 15 min). Call once on server boot. */
export const startPaymentReconcileSweepJob = () => {
  cron.schedule("*/15 * * * *", () => {
    runPaymentReconcileSweep().catch((err) =>
      logger.error("Payment reconcile sweep failed", { error: err.message })
    );
  });
  logger.info("Payment reconcile sweep cron scheduled (every 15 min)");
};

export default startPaymentReconcileSweepJob;
