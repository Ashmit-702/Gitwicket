import type { RawGithubStats } from "./github";
import { computeDimensions, computeForm, weightedOverall, applyStability, type Dimensions } from "./rating";

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

export interface DimensionBreakdown {
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  note: string;
}

export interface CricketCardStats {
  login: string;
  name: string;
  avatarUrl: string;
  platform: Platform;
  country?: string;
  role: Role;
  topLanguage?: string | null;
  taglineTag?: string;
  tagline?: string;
  tier: Tier;
  rating: number; // Overall — out of 99, absolute/population-calibrated, stability-updated
  form?: number; // out of 99 — recency-weighted, separate from rating by construction
  formTrend?: "up" | "down" | "flat";
  dimensions?: DimensionBreakdown[]; // explainability — "why is my rating X"
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

// Relative "shape" — deliberately scoped to Attributes ONLY. Earlier versions let this
// feed the overall rating directly, which meant a balanced-but-modest profile and a
// balanced-and-strong profile could land on a similar number just for having a similar
// *shape* — that's the exact failure mode a real rating system can't have. Overall now
// comes from lib/rating.ts's absolute, population-weighted dimension engine instead.
// This stays for the 6-stat card face and star attributes, where "what are you
// relatively strongest at" is a legitimate, fun thing to show — it just no longer
// decides how good the card holder is.
const SHAPE_CENTER = 60;
const SHAPE_SPREAD = 15;
const RELATIVE_WEIGHT = 0.7;

export function shapeScores(scores: number[]): number[] {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, v) => sum + (v - mean) ** 2, 0) / scores.length;
  const std = Math.sqrt(variance);
  return scores.map((v) => {
    const z = std > 0 ? (v - mean) / std : 0;
    const relative = clamp(Math.round(SHAPE_CENTER + z * SHAPE_SPREAD), 1, 88);
    return clamp(Math.round(RELATIVE_WEIGHT * relative + (1 - RELATIVE_WEIGHT) * v), 1, 88);
  });
}

const DIMENSION_META: Record<keyof Dimensions, { label: string; note: string }> = {
  engineeringActivity: { label: "Engineering Activity", note: "Commit volume over the last year, with diminishing returns." },
  collaboration: { label: "Collaboration", note: "PRs merged into repos you don't own, plus reviews given." },
  consistency: { label: "Consistency", note: "Share of the year's weeks with any real activity." },
  projectDepth: { label: "Project Depth", note: "Weak proxy signals only (license, description, repo size) — kept low-weight on purpose." },
  impact: { label: "Impact", note: "Stars, forks, followers — capped, heavily diminishing." },
  breadth: { label: "Breadth", note: "Distinct languages used, with a hard diminishing curve." },
  community: { label: "Community", note: "Issues closed and external contributions." },
};

export function mapToCricketStats(raw: RawGithubStats, previousRating: number | null = null): CricketCardStats {
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
  const wickets = raw.pullRequestsMergedToOthers * 2 + raw.reviews + Math.round(raw.repoCount * 0.6);
  const economy = clamp(
    Number((10 - Math.log10(raw.stars + 1) * 1.8 - Math.log10(raw.followers + 1) * 0.6).toFixed(1)),
    2,
    10
  );
  const boundaries = raw.stars;
  const catches = raw.reviews + Math.round(raw.issuesClosed / 5);

  // ============================================================================
  // OVERALL — absolute, dimension-weighted, stability-updated. This is the one
  // number that's supposed to mean roughly the same thing for any two users, and
  // roughly the same thing for the same user six months apart. See lib/rating.ts
  // for the full reasoning on diminishing returns, weights, and the stability
  // mechanism (which replaces a confidence-pull-to-average approach: a genuinely
  // strong new account shows its true value immediately, since there's nothing to
  // blend against on the first-ever reading; only later readings get smoothed).
  // ============================================================================
  const dims = computeDimensions(raw);
  const measuredOverall = weightedOverall(dims); // 0-100
  const stabilized = applyStability(previousRating === null ? null : previousRating, measuredOverall);
  const rating = clamp(Math.round(stabilized * 0.99), 0, 99); // display scale stays "out of 99"

  const tier: Tier = rating >= 90 ? "Legend" : rating >= 78 ? "Gold" : rating >= 55 ? "Silver" : "Bronze";

  const formRaw = computeForm(raw); // 0-100, recency-weighted, independent of Overall
  const form = clamp(Math.round(formRaw * 0.99), 0, 99);
  const formTrend: "up" | "down" | "flat" = form > rating + 4 ? "up" : form < rating - 4 ? "down" : "flat";

  const dimensions: DimensionBreakdown[] = (Object.keys(dims) as (keyof Dimensions)[]).map((key) => ({
    label: DIMENSION_META[key].label,
    score: dims[key],
    weight: [0.25, 0.2, 0.15, 0.08, 0.12, 0.1, 0.1][
      ["engineeringActivity", "collaboration", "consistency", "projectDepth", "impact", "breadth", "community"].indexOf(key)
    ],
    note: DIMENSION_META[key].note,
  }));

  // ============================================================================
  // ATTRIBUTES / CARD FACE — six cricket-flavored slots, each fed by one (or a
  // blend of two) of the seven dimensions above, then relatively shaped against
  // each other. This is deliberately separate from Overall — it answers "where is
  // this person relatively strongest," not "how good are they."
  // ============================================================================
  const strikeAbs = dims.engineeringActivity;
  const battingAbs = Math.round(dims.engineeringActivity * 0.5 + dims.consistency * 0.5);
  const wicketAbs = dims.collaboration;
  const economyAbs = dims.projectDepth;
  const boundaryAbs = dims.impact;
  const catchAbs = dims.community;

  const [battingHyb, strikeHyb, wicketHyb, economyHyb, boundaryHyb, catchHyb] = shapeScores([
    battingAbs,
    strikeAbs,
    wicketAbs,
    economyAbs,
    boundaryAbs,
    catchAbs,
  ]);

  // Role is derived from the attribute vector, not from Overall — a strong "shape"
  // toward collaboration doesn't need a strong Overall to earn a Bowler tag.
  const battingSkill = (battingHyb + strikeHyb + boundaryHyb) / 3;
  const bowlingSkill = (wicketHyb + economyHyb) / 2;
  const fieldingSkill = catchHyb;

  let role: Role = "Batsman";
  if (fieldingSkill >= 55 && fieldingSkill >= bowlingSkill) role = "Wicketkeeper";
  else if (bowlingSkill >= battingSkill && bowlingSkill >= 40) role = "Bowler";
  else if (battingSkill >= 45 && bowlingSkill >= 40) role = "All-rounder";

  const cardStats: CardStat[] = [
    { label: "Strike rate", abbr: "STR", value: strikeHyb },
    { label: "Batting avg", abbr: "AVG", value: battingHyb },
    { label: "Wickets", abbr: "WKT", value: wicketHyb },
    { label: "Economy", abbr: "ECO", value: economyHyb },
    { label: "Boundaries", abbr: "BND", value: boundaryHyb },
    { label: "Catches", abbr: "CAT", value: catchHyb },
  ];

  const scoutingMetrics: ScoutingMetric[] = [
    {
      label: "Commits",
      raw: raw.commits,
      suffix: "in the last year",
      score: dims.engineeringActivity,
      explanation: "Recent commit volume, with diminishing returns — feeds Engineering Activity and Strike Rate.",
    },
    {
      label: "Stars earned",
      raw: raw.stars,
      suffix: "across owned repos",
      score: dims.impact,
      explanation: "Stars, forks, and followers combined, heavily capped — feeds Impact and Boundaries.",
    },
    {
      label: "Followers",
      raw: raw.followers,
      suffix: "followers",
      score: curve(raw.followers, 180),
      explanation: "Part of Impact alongside stars — capped so popularity alone can't dominate.",
    },
    {
      label: "PRs merged elsewhere",
      raw: raw.pullRequestsMergedToOthers,
      suffix: "into repos you don't own",
      score: dims.collaboration,
      explanation: "Real collaboration signal — merged PRs into other people's repos, plus reviews — feeds Wickets.",
    },
    {
      label: "Code reviews",
      raw: raw.reviews,
      suffix: "given this year",
      score: dims.community,
      explanation: "Reviews given plus issues closed — feeds Community and Catches.",
    },
    {
      label: "Repos shipped",
      raw: raw.repoCount,
      suffix: "owned, non-fork repos",
      score: curve(raw.repoCount, 15),
      explanation: "Solo-built projects count too, but lightly — repo count alone is easy to game.",
    },
    {
      label: "Issues closed",
      raw: raw.issuesClosed,
      suffix: "closed all-time",
      score: curve(raw.issuesClosed, 40),
      explanation: "Maintenance and triage — supports Community and role detection.",
    },
    {
      label: "Active years",
      raw: activeYears,
      suffix: activeYears === 1 ? "year with activity" : "years with activity",
      score: curve(activeYears, 6),
      explanation: "Distinct years you've actually contributed — powers Consistency and long-term tenure.",
    },
  ];

  const attributes: Attribute[] = [
    { label: "Consistency", stars: toStars(battingHyb) },
    { label: "Power hitting", stars: toStars(boundaryHyb) },
    { label: "Control", stars: toStars(economyHyb) },
    { label: "Support play", stars: toStars(catchHyb) },
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
    ["Consistent run-scorer", battingHyb],
    ["Explosive striker", strikeHyb],
    ["Wicket-taking menace", wicketHyb],
    ["Economical operator", economyHyb],
    ["Big-hitting star", boundaryHyb],
    ["Safe pair of hands", catchHyb],
  ];
  scored.sort((a, b) => b[1] - a[1]);
  const signatureStat = scored[0][1] > 0 ? scored[0][0] : "Still finding their game";

  let taglineTag = "RISING TALENT";
  let tagline = "Still finding rhythm at the crease — but building fast.";
  if (raw.languageCount >= 5) {
    taglineTag = "POLYGLOT";
    tagline = `Fluent across ${raw.languageCount} languages, ${raw.topLanguage ?? "code"} most of all.`;
  } else if (tier === "Legend") {
    taglineTag = "HALL OF FAME";
    tagline = "A generational talent: high and balanced, earned over years.";
  } else if (role === "Wicketkeeper") {
    taglineTag = "SAFE HANDS";
    tagline = "The one every maintainer wants reviewing their PRs.";
  } else if (role === "Bowler") {
    taglineTag = "SILENT KILLER";
    tagline = "Racks up wickets while nobody's watching the PR queue.";
  } else if (role === "All-rounder") {
    taglineTag = "ONE TO WATCH";
    tagline = "Does damage with the bat and the ball alike.";
  } else if (tier === "Gold") {
    taglineTag = "MATCH WINNER";
    tagline = "The kind of player who single-handedly turns a game.";
  } else if (tier === "Silver") {
    taglineTag = "STEADY HAND";
    tagline = "Reliable and consistent, match after match.";
  }

  return {
    login: raw.login,
    name: raw.name ?? raw.login,
    avatarUrl: raw.avatarUrl,
    platform: "github",
    role,
    topLanguage: raw.topLanguage,
    taglineTag,
    tagline,
    tier,
    rating,
    form,
    formTrend,
    dimensions,
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
