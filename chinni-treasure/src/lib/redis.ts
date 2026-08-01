import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL;

let client: Redis | null = null;

if (redisUrl) {
  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
  });
  client.on("error", () => {});
}

export const redis = client;
