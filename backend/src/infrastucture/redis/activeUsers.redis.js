import redis from "../../config/redis.js";

const ACTIVE_WINDOW = 60; // seconds

export const markUserActive = async (userId) => {
  await redis.setex(`active:user:${userId}`, ACTIVE_WINDOW, "1");
};

export const getActiveUsersCount = async () => {
  const keys = await redis.keys("active:user:*");
  return keys.length;
};
