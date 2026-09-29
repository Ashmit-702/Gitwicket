import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// TODO: once you have real traffic, list recently-rated usernames from Redis here
// (e.g. redis.keys("card:*")) so every profile page gets indexed individually —
// that's the actual SEO engine, not this static list.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/build-career-card`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
