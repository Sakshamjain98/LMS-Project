import redisClient from "../../config/redis.js";

const ACTIVE_WINDOW = 60;

export const markUserActive = async (userId) => {
  if (!userId) return;

  const key = `active:user:${userId.toString()}`;
  await redisClient.set(key, "1");
  await redisClient.expire(key, ACTIVE_WINDOW);
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