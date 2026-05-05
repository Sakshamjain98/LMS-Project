import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

let hasLoggedRedisError = false;

redisClient.on("error", (err) => {
  if (!hasLoggedRedisError) {
    console.error("Redis Error:", err?.message || err);
    hasLoggedRedisError = true;
  }
});

redisClient.on("ready", () => {
  hasLoggedRedisError = false;
});

redisClient.connect().catch((err) => {
  console.error("Redis connection failed:", err?.message || err);
});

export default redisClient;
export const isRedisReady = () => redisClient?.isReady && redisClient?.isOpen;
