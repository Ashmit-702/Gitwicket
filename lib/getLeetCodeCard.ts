import Redis from "ioredis";
import { fetchLeetCodeStats } from "./leetcode";
import { mapToLeetCodeCricketStats } from "./leetcodeStats";
import type { CricketCardStats } from "./cricketStats";

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

const CACHE_SECONDS = 60 * 60 * 6;
const CACHE_VERSION = "v1";

export async function getLeetCodeCard(username: string): Promise<CricketCardStats | null> {
  if (!username) return null;

  const key = `lc-card:${CACHE_VERSION}:${username.toLowerCase()}`;
  const client = getRedis();

  if (client) {
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached) as CricketCardStats;
  }

  const raw = await fetchLeetCodeStats(username);
  if (!raw) return null;

  const card = mapToLeetCodeCricketStats(raw);

  if (client) {
    await client.set(key, JSON.stringify(card), "EX", CACHE_SECONDS);
  }

  return card;
}
