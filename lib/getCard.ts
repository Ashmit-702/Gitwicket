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
// v5: rating-engine recalibration — see lib/rating.ts for the full writeup. Also
// fixes the stability-state key below to be versioned (it previously wasn't).
const CACHE_VERSION = "v5";

// Separate from the 6-hour card cache — this is the rating STABILITY state (see
// lib/rating.ts applyStability). It needs to persist far longer than a card cache
// entry, since its entire job is remembering "what did we show last time" across
// many cache expirations, so a fresh measurement gets blended in gradually instead
// of the displayed rating jumping straight to whatever the API returns on any given
// day. No TTL — a dormant account's last-known rating should still be there whenever
// they're looked up again, even a year later.
//
// RATING_ALGO_VERSION is intentionally a SEPARATE constant from CACHE_VERSION, and
// is folded into this key. This is the fix for the v4 -> v5 regression-adjacent bug:
// the stability key used to have no version at all, so a rating computed under an
// old, broken model (e.g. someone stuck at ~30 under v4's undervaluation bug) would
// sit in Redis forever with no TTL and get blended into every future measurement via
// applyStability — permanently poisoning the displayed rating even after the model
// was fixed, since PERSISTENCE=0.6 means the stale value decays very slowly. Bumping
// RATING_ALGO_VERSION whenever the *scoring math* changes (not just card shape)
// starts every user fresh on the new model's first read, exactly like a brand-new
// account (previousRating === null), then lets stability smoothing take over from
// there for genuinely new measurements going forward.
const RATING_ALGO_VERSION = "v5";

function ratingStateKey(username: string): string {
  return `rating-state:${RATING_ALGO_VERSION}:github:${username.toLowerCase()}`;
}

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

  let previousRating: number | null = null;
  if (client) {
    const stored = await client.get(ratingStateKey(username));
    previousRating = stored ? Number(stored) : null;
  }

  const card = mapToCricketStats(raw, previousRating);

  if (client) {
    await client.set(key, JSON.stringify(card), "EX", CACHE_SECONDS);
    await client.set(ratingStateKey(username), String(card.rating)); // no TTL — see comment above
  }

  return card;
}
