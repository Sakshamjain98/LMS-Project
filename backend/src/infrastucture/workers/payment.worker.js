import { Worker } from "bullmq";
import redis from "../../config/redis.js";
import Subscription from "../../models/subscription.model.js";
import Invoice from "../../models/invoice.model.js";
import logger from "../logger/logger.js";
import { SUBSCRIPTION_PLANS } from "../../constants/subscription.js";

new Worker(
  "payments",
  async (job) => {
    const { userId, paymentId, plan, amount } = job.data;

    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + planConfig.duration * 24 * 60 * 60 * 1000
    );

    // Atomic subscription grant with extension support
    const existingSub = await Subscription.findOne({ userId });
    
    let newEndDate = endDate;
    // If active subscription exists, extend from current end date
    if (existingSub && existingSub.status === "ACTIVE" && existingSub.endDate > new Date()) {
      newEndDate = new Date(
        existingSub.endDate.getTime() + planConfig.duration * 24 * 60 * 60 * 1000
      );
    }

    await Subscription.findOneAndUpdate(
      { userId },
      {
        plan,
        billingCycle: plan,
        status: "ACTIVE",
        price: amount,
        startDate: existingSub?.status === "ACTIVE" ? existingSub.startDate : startDate,
        endDate: newEndDate,
        $push: {
          paymentHistory: {
            paymentId,
            amount,
            paidAt: new Date(),
            plan,
          },
        },
      },
      { upsert: true, new: true }
    );

    // Create invoice
    const gst = amount * 0.18;
    await Invoice.create({
      userId,
      paymentId,
      amount,
      gst,
      total: amount + gst,
      plan,
      billingPeriod: {
        start: startDate,
        end: newEndDate,
      },
    });

    logger.info("Subscription granted", { userId, paymentId, plan, endDate: newEndDate });
  },
  { connection: redis }
);
