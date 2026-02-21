import { Worker } from "bullmq";
import redis from "../../config/redis.js";
import logger from "../logger/logger.js";

/**
 * Activity Logs Worker
 * --------------------
 * Ye worker background me Redis queue se jobs uthata hai
 * aur unko logger ke through store karta hai.
 */

const activityWorker = new Worker(
  "activity-logs",
  async (job) => {
    try {
      logger.info("User activity", job.data);
    } catch (error) {
      logger.error("Activity log failed", {
        error: error.message,
        jobId: job.id,
        data: job.data,
      });
      throw error; // BullMQ ko batata hai ki job fail hui
    }
  },
  {
    connection: redis,
  }
);

/**
 * Worker lifecycle logs
 */
activityWorker.on("ready", () => {
  console.log("🟢 Activity worker is ready and listening for jobs...");
});

activityWorker.on("failed", (job, err) => {
  logger.error("Activity job failed", {
    jobId: job?.id,
    error: err.message,
  });
});

export default activityWorker;
