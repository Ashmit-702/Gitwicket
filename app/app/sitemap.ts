import type { MetadataRoute } from "next";

// TODO: once you have real traffic, list recently-rated usernames from Redis here
// (e.g. redis.keys("card:*")) so every profile page gets indexed individually —
// that's the actual SEO engine, not this static list.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://gitwicket.dev",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
