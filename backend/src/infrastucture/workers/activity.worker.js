import { Worker } from "bullmq";
import redis from "../../config/redis.js";
import logger from "../logger/logger.js";
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
      throw error;
    }
  },
  {
    connection: redis,
  }
);

activityWorker.on("ready", () => {
  console.log("Activity worker is ready and listening for jobs...");
});

activityWorker.on("failed", (job, err) => {
  logger.error("Activity job failed", {
    jobId: job?.id,
    error: err.message,
  });
});

export default activityWorker;
