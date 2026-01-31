/** @format */
import IORedis from "ioredis";
import { createEmailQueue } from "@power/queue/src/factory";

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new IORedis(REDIS_URL);
export const emailQueue = createEmailQueue(redis);

process.on("SIGTERM", async () => {
  await emailQueue.close();
  redis.disconnect();
});
