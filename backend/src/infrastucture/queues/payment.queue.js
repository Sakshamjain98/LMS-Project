import { Queue } from "bullmq";
import redis from "../../config/redis.js";

export const paymentQueue = new Queue("payments", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});
