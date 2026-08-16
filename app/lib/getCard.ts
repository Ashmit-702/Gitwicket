import Redis from "ioredis";
import { fetchGithubStats } from "./github";
import { mapToCricketStats, type CricketCardStats } from "./cricketStats";

// Uses standard Redis Cloud (Vercel's default "Redis" marketplace option), connected
// over TCP via a redis:// connection string — not Upstash's REST API.
// Because this is a real TCP connection, it can only run in the Node.js serverless
// runtime, not Vercel's Edge Runtime (see app/api/card/[username]/route.tsx).
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

const CACHE_SECONDS = 60 * 60 * 6; // 6 hours — cards feel fresh without hammering the API

// Bump this whenever CricketCardStats' shape or the rating algorithm changes.
// Without it, old cached entries (with a different shape / different numbers)
// get served as-is for up to CACHE_SECONDS, silently masking any update.
const CACHE_VERSION = "v3";

export async function getCard(username: string): Promise<CricketCardStats | null> {
  if (!username) return null;

  const key = `card:${CACHE_VERSION}:${username.toLowerCase()}`;
  const client = getRedis();

  if (client) {
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached) as CricketCardStats;
  }

  const raw = await fetchGithubStats(username);
  if (!raw) return null;

  const card = mapToCricketStats(raw);

  if (client) {
    await client.set(key, JSON.stringify(card), "EX", CACHE_SECONDS);
  }

  return card;
}
