import { Queue, Worker } from "bullmq";
import redis from "../../config/redis.js";
import Test from "../../models/test.model.js";
import logger from "../logger/logger.js";

export const testPublishQueue = new Queue("test-publish", {
  connection: redis,
});

new Worker(
  "test-publish",
  async (job) => {
    const { testId } = job.data;

    await Test.findByIdAndUpdate(testId, {
      status: "published",
    });

    logger.info("Test published", { testId });
  },
  { connection: redis }
);
