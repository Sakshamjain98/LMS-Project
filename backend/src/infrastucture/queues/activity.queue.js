import { Queue } from "bullmq";
import redis from "../../config/redis.js";

export const activityQueue = new Queue("activity-logs", {
  connection: redis,
});
