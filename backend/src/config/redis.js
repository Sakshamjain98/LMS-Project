import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.connect().catch((err) => {
  console.error("Redis connection failed:", err?.message || err);
});

export default redisClient;
