import redisClient from "../../config/redis.js";

const ACTIVE_WINDOW = 60;

export const markUserActive = async (userId) => {
  if (!userId) return;

  if (!redisClient?.isOpen) return;

  const key = `active:user:${userId.toString()}`;
  try {
    await redisClient.set(key, "1");
    await redisClient.expire(key, ACTIVE_WINDOW);
  } catch (error) {
    console.error("Failed to mark user active:", error?.message || error);
  }
};

export const getActiveUsersCount = async () => {
  let cursor = "0";
  let total = 0;

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: "active:user:*",
      COUNT: 100,
    });

    cursor = nextCursor;
    total += keys.length;
  } while (cursor !== "0");

  return total;
};
