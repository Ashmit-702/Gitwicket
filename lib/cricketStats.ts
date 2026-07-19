import type { RawGithubStats } from "./github";

export type Role = "Batsman" | "Bowler" | "All-rounder" | "Wicketkeeper";
export type Tier = "Bronze" | "Silver" | "Gold" | "Legend";
export type Platform = "github" | "leetcode";

export interface CardStat {
  label: string;
  abbr: string; // 3-letter, FUT-style
  value: number; // 0-99, uniform across all six — this is what shows on the card face
}

export interface ScoutingMetric {
  label: string;
  raw: number;
  suffix: string;
  score: number; // 0-99
  explanation: string;
}

export interface Attribute {
  label: string;
  stars: number; // 1-5
}

export interface CricketCardStats {
  login: string;
  name: string;
  avatarUrl: string;
  platform: Platform;
  role: Role;
  tier: Tier;
  rating: number; // out of 99 — shown big on the card, labeled "RATING" (never "OVR")
  // literal, human-readable cricket numbers — used in the scouting panel and page copy,
  // NOT on the card face (the card face uses cardStats, which are uniformly 0-99)
  strikeRate: number;
  battingAverage: number;
  wickets: number;
  economy: number;
  boundaries: number;
  catches: number;
  cardStats: CardStat[];
  scoutingMetrics: ScoutingMetric[];
  attributes: Attribute[];
  playstyles: string[];
  accountAgeYears: number;
  activeYears: number;
  signatureStat: string;
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function curve(x: number, midpoint: number): number {
  return clamp(Math.round(99 * (1 - Math.exp(-Math.max(0, x) / midpoint))), 0, 99);
}

export const toStars = (score: number) => clamp(Math.round(score / 20), 1, 5);

export function mapToCricketStats(raw: RawGithubStats): CricketCardStats {
  const accountAgeYears = Math.max(
    0.1,
    (Date.now() - new Date(raw.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );
  const activeYears = raw.activeYears;

  // --- literal cricket numbers (human-readable, uncapped where real cricket stats are) ---
  const strikeRate = clamp(Math.round((raw.commits / 3.65) * 1), 0, 300);
  const battingAverage = clamp(
    Math.round((raw.commits + raw.pullRequestsMerged * 3 + raw.reviews * 1.5) / activeYears / 4),
    0,
    99
  );
  const wickets = raw.pullRequestsMerged + raw.reviews;
  const economy = clamp(
    Number((10 - Math.log10(raw.stars + 1) * 1.8 - Math.log10(raw.followers + 1) * 0.6).toFixed(1)),
    2,
    10
  );
  const boundaries = raw.stars;
  const catches = raw.reviews;

  // --- uniform 0-99 sub-scores — these are what actually appear on the card face ---
  const battingScore = battingAverage;
  const strikeScore = curve(strikeRate, 75);
  const wicketScore = curve(wickets, 26);
  const economyScore = curve(10 - economy, 4);
  const boundaryScore = curve(boundaries, 35);
  const catchScore = curve(catches, 13);

  const rawOverall =
    battingScore * 0.25 +
    strikeScore * 0.2 +
    wicketScore * 0.2 +
    economyScore * 0.15 +
    boundaryScore * 0.12 +
    catchScore * 0.08;

  // no artificial floor — a near-empty profile should honestly show a near-empty rating,
  // rather than every account landing around the same "35" regardless of real activity
  let rating = clamp(Math.round(rawOverall), 8, 92);

  const isLegendEligible =
    activeYears >= 4 && accountAgeYears >= 4 && raw.followers >= 400 && raw.stars >= 800 && rating >= 78;
  if (isLegendEligible) rating = clamp(rating + 9, 8, 99);

  const tier: Tier = rating >= 90 ? "Legend" : rating >= 78 ? "Gold" : rating >= 55 ? "Silver" : "Bronze";

  const total = Math.max(1, raw.commits + raw.pullRequests + raw.reviews);
  const reviewShare = raw.reviews / total;
  const prShare = raw.pullRequestsMerged / Math.max(1, raw.pullRequestsMerged + raw.commits);
  let role: Role = "Batsman";
  if (reviewShare > 0.4) role = "Wicketkeeper";
  else if (prShare > 0.35 && reviewShare > 0.12) role = "All-rounder";
  else if (raw.issues + raw.pullRequests > raw.commits) role = "Bowler";

  const cardStats: CardStat[] = [
    { label: "Strike rate", abbr: "STR", value: strikeScore },
    { label: "Batting avg", abbr: "AVG", value: battingScore },
    { label: "Wickets", abbr: "WKT", value: wicketScore },
    { label: "Economy", abbr: "ECO", value: economyScore },
    { label: "Boundaries", abbr: "BND", value: boundaryScore },
    { label: "Catches", abbr: "CAT", value: catchScore },
  ];

  const scoutingMetrics: ScoutingMetric[] = [
    {
      label: "Commits",
      raw: raw.commits,
      suffix: "in the last year",
      score: strikeScore,
      explanation: "Recent commit volume — feeds Strike Rate.",
    },
    {
      label: "Stars earned",
      raw: raw.stars,
      suffix: "across owned repos",
      score: boundaryScore,
      explanation: "Total stars on your non-fork repos — feeds Boundaries.",
    },
    {
      label: "Followers",
      raw: raw.followers,
      suffix: "followers",
      score: curve(raw.followers, 180),
      explanation: "Reach and influence — softens Economy alongside stars.",
    },
    {
      label: "Merged PRs",
      raw: raw.pullRequestsMerged,
      suffix: "merged all-time",
      score: curve(raw.pullRequestsMerged, 40),
      explanation: "Shipped work, not just opened — the core of Wickets.",
    },
    {
      label: "Code reviews",
      raw: raw.reviews,
      suffix: "given this year",
      score: catchScore,
      explanation: "Reviews given to others — feeds Catches.",
    },
    {
      label: "Issues closed",
      raw: raw.issuesClosed,
      suffix: "closed all-time",
      score: curve(raw.issuesClosed, 40),
      explanation: "Maintenance and triage — supports role detection.",
    },
    {
      label: "Active years",
      raw: activeYears,
      suffix: activeYears === 1 ? "year with activity" : "years with activity",
      score: curve(activeYears, 6),
      explanation: "Distinct years you've actually contributed — powers Batting Average and the Legend gate.",
    },
  ];

  const attributes: Attribute[] = [
    { label: "Consistency", stars: toStars(battingScore) },
    { label: "Power hitting", stars: toStars(boundaryScore) },
    { label: "Control", stars: toStars(economyScore) },
    { label: "Support play", stars: toStars(catchScore) },
    { label: "Longevity", stars: toStars(curve(activeYears, 6)) },
  ];

  const playstyles: string[] = [];
  if (battingAverage >= 70) playstyles.push("Century Maker");
  if (wickets >= 30) playstyles.push("Death Bowler");
  if (catches >= 15) playstyles.push("Safe Hands");
  if (activeYears >= 5) playstyles.push("Marathoner");
  if (strikeRate >= 150) playstyles.push("Rapid Fire");
  if (boundaries >= 100) playstyles.push("Crowd Puller");
  if (raw.followers >= 1000) playstyles.push("Franchise Player");
  if (playstyles.length === 0) playstyles.push("Rising Talent");

  const scored: [string, number][] = [
    ["Consistent run-scorer", battingScore],
    ["Explosive striker", strikeScore],
    ["Wicket-taking menace", wicketScore],
    ["Economical operator", economyScore],
    ["Big-hitting star", boundaryScore],
    ["Safe pair of hands", catchScore],
  ];
  scored.sort((a, b) => b[1] - a[1]);
  const signatureStat = scored[0][1] > 0 ? scored[0][0] : "Still finding their game";

  return {
    login: raw.login,
    name: raw.name ?? raw.login,
    avatarUrl: raw.avatarUrl,
    platform: "github",
    role,
    tier,
    rating,
    strikeRate,
    battingAverage,
    wickets,
    economy,
    boundaries,
    catches,
    cardStats,
    scoutingMetrics,
    attributes,
    playstyles,
    accountAgeYears: Math.round(accountAgeYears * 10) / 10,
    activeYears,
    signatureStat,
  };
}
