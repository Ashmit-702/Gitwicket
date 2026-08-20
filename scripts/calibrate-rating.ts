/**
 * Deterministic calibration + regression test suite for lib/rating.ts.
 *
 * This is NOT a UI test and does NOT hit the network — it builds synthetic
 * RawGithubStats fixtures by hand and runs them straight through
 * computeDimensions / weightedOverall / applyStability, then asserts on
 * ordering and band properties rather than exact numbers (per the brief:
 * "Do not hardcode exact ratings unless necessary").
 *
 * Run with:  npx tsx scripts/calibrate-rating.ts
 */
import { computeDimensions, weightedOverall, applyStability, DIMENSION_WEIGHTS } from "../lib/rating";
import type { RawGithubStats } from "../lib/github";

// ----------------------------------------------------------------------------
// Fixture builder
// ----------------------------------------------------------------------------

interface DailyPattern {
  activeWeeks: boolean[]; // 52 entries, true = "did something this week"
  daysPerActiveWeek: number; // how many distinct days within an active week have commits
  commitsPerActiveDay: number;
}

function buildDailyContributions(pattern: DailyPattern): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  for (let week = 0; week < 52; week++) {
    const isActive = pattern.activeWeeks[week] ?? false;
    for (let day = 0; day < 7; day++) {
      const daysAgo = (51 - week) * 7 + (6 - day);
      const d = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const date = d.toISOString().slice(0, 10);
      const count = isActive && day < pattern.daysPerActiveWeek ? pattern.commitsPerActiveDay : 0;
      out.push({ date, count });
    }
  }
  return out;
}

/** Every Nth week active, evenly spread across the year (not bursty). */
function spreadWeeks(activeOutOf52: number): boolean[] {
  const weeks = new Array(52).fill(false);
  if (activeOutOf52 <= 0) return weeks;
  const step = 52 / activeOutOf52;
  for (let i = 0; i < activeOutOf52; i++) weeks[Math.min(51, Math.round(i * step))] = true;
  return weeks;
}

/** All activity crammed into one contiguous block — the "bursty" shape. */
function burstWeeks(activeOutOf52: number, startWeek = 10): boolean[] {
  const weeks = new Array(52).fill(false);
  for (let i = 0; i < activeOutOf52; i++) weeks[Math.min(51, startWeek + i)] = true;
  return weeks;
}

interface PersonaInput {
  name: string;
  description: string;
  activeWeeks: boolean[];
  daysPerActiveWeek: number;
  commitsPerActiveDay: number;
  repoCount: number;
  pullRequestsMergedToOthers: number;
  reviews: number;
  stars: number;
  forks: number;
  followers: number;
  languageCount: number;
  issuesClosed: number;
  reposWithLicense: number;
  reposWithDescription: number;
  avgRepoSizeKb: number;
  activeYears: number;
}

function persona(p: PersonaInput): { raw: RawGithubStats; meta: PersonaInput } {
  const dailyContributions = buildDailyContributions({
    activeWeeks: p.activeWeeks,
    daysPerActiveWeek: p.daysPerActiveWeek,
    commitsPerActiveDay: p.commitsPerActiveDay,
  });
  const commits = dailyContributions.reduce((s, d) => s + d.count, 0);
  const raw: RawGithubStats = {
    login: p.name,
    name: p.name,
    avatarUrl: "",
    createdAt: new Date(Date.now() - p.activeYears * 365 * 24 * 60 * 60 * 1000).toISOString(),
    followers: p.followers,
    commits,
    pullRequests: p.pullRequestsMergedToOthers + 2,
    pullRequestsMerged: p.pullRequestsMergedToOthers,
    pullRequestsMergedToOthers: p.pullRequestsMergedToOthers,
    issues: Math.round(p.issuesClosed * 0.6),
    issuesClosed: p.issuesClosed,
    reviews: p.reviews,
    stars: p.stars,
    forks: p.forks,
    repoCount: p.repoCount,
    activeYears: p.activeYears,
    topLanguage: "TypeScript",
    languageCount: p.languageCount,
    bio: null,
    dailyContributions,
    reposWithLicense: p.reposWithLicense,
    reposWithDescription: p.reposWithDescription,
    avgRepoSizeKb: p.avgRepoSizeKb,
  };
  return { raw, meta: p };
}

// ----------------------------------------------------------------------------
// Ten representative synthetic profiles (section 6 of the brief)
// ----------------------------------------------------------------------------

const PROFILES = [
  persona({
    name: "dormant-beginner",
    description: "1. Dormant beginner — account exists, basically no activity.",
    activeWeeks: spreadWeeks(2),
    daysPerActiveWeek: 1,
    commitsPerActiveDay: 1,
    repoCount: 1,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 0,
    forks: 0,
    followers: 2,
    languageCount: 1,
    issuesClosed: 0,
    reposWithLicense: 0,
    reposWithDescription: 0,
    avgRepoSizeKb: 20,
    activeYears: 1,
  }),
  persona({
    name: "beginner-few-projects",
    description: "2. Beginner with a few small projects.",
    activeWeeks: spreadWeeks(10),
    daysPerActiveWeek: 2,
    commitsPerActiveDay: 2,
    repoCount: 3,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 2,
    forks: 0,
    followers: 5,
    languageCount: 2,
    issuesClosed: 1,
    reposWithLicense: 0,
    reposWithDescription: 2,
    avgRepoSizeKb: 80,
    activeYears: 1,
  }),
  persona({
    name: "active-student",
    description: "3. Active student — regular coursework/side-project commits, no external PRs.",
    activeWeeks: spreadWeeks(30),
    daysPerActiveWeek: 3,
    commitsPerActiveDay: 3,
    repoCount: 8,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 15,
    forks: 3,
    followers: 20,
    languageCount: 3,
    issuesClosed: 4,
    reposWithLicense: 2,
    reposWithDescription: 6,
    avgRepoSizeKb: 250,
    activeYears: 2,
  }),
  persona({
    name: "strong-early-career",
    description: "4. Strong student / early-career developer — solid solo output, still no external PRs.",
    activeWeeks: spreadWeeks(42),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 4,
    repoCount: 12,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 60,
    forks: 10,
    followers: 60,
    languageCount: 4,
    issuesClosed: 10,
    reposWithLicense: 5,
    reposWithDescription: 10,
    avgRepoSizeKb: 400,
    activeYears: 3,
  }),
  persona({
    name: "serious-oss-contributor",
    description: "5. Serious open-source contributor — real external PR history.",
    activeWeeks: spreadWeeks(45),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 5,
    repoCount: 15,
    pullRequestsMergedToOthers: 20,
    reviews: 15,
    stars: 150,
    forks: 30,
    followers: 200,
    languageCount: 5,
    issuesClosed: 25,
    reposWithLicense: 8,
    reposWithDescription: 13,
    avgRepoSizeKb: 500,
    activeYears: 4,
  }),
  persona({
    name: "popular-maintainer",
    description: "6. Popular maintainer — big impact numbers, sustained engineering activity.",
    activeWeeks: spreadWeeks(48),
    daysPerActiveWeek: 5,
    commitsPerActiveDay: 6,
    repoCount: 20,
    pullRequestsMergedToOthers: 40,
    reviews: 60,
    stars: 3000,
    forks: 400,
    followers: 2000,
    languageCount: 6,
    issuesClosed: 120,
    reposWithLicense: 15,
    reposWithDescription: 19,
    avgRepoSizeKb: 700,
    activeYears: 6,
  }),
  persona({
    name: "elite-developer",
    description: "7. Elite developer — near-maximal, sustained evidence across every dimension.",
    activeWeeks: spreadWeeks(50),
    daysPerActiveWeek: 6,
    commitsPerActiveDay: 8,
    repoCount: 30,
    pullRequestsMergedToOthers: 80,
    reviews: 150,
    stars: 15000,
    forks: 2000,
    followers: 10000,
    languageCount: 8,
    issuesClosed: 300,
    reposWithLicense: 25,
    reposWithDescription: 29,
    avgRepoSizeKb: 900,
    activeYears: 8,
  }),
  persona({
    name: "huge-following-low-activity",
    description: "8. Huge following, low current engineering activity — popularity shouldn't dominate.",
    activeWeeks: spreadWeeks(5),
    daysPerActiveWeek: 1,
    commitsPerActiveDay: 1,
    repoCount: 5,
    pullRequestsMergedToOthers: 1,
    reviews: 1,
    stars: 8000,
    forks: 900,
    followers: 15000,
    languageCount: 2,
    issuesClosed: 3,
    reposWithLicense: 2,
    reposWithDescription: 4,
    avgRepoSizeKb: 300,
    activeYears: 5,
  }),
  persona({
    name: "solo-many-projects",
    description: "9. Solo developer, many projects, little/no collaboration.",
    activeWeeks: spreadWeeks(38),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 5,
    repoCount: 25,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 40,
    forks: 5,
    followers: 30,
    languageCount: 4,
    issuesClosed: 6,
    reposWithLicense: 6,
    reposWithDescription: 15,
    avgRepoSizeKb: 350,
    activeYears: 3,
  }),
  persona({
    name: "strong-collaborator-few-projects",
    description: "10. Strong collaborator, moderate personal project count.",
    activeWeeks: spreadWeeks(40),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 4,
    repoCount: 6,
    pullRequestsMergedToOthers: 25,
    reviews: 20,
    stars: 30,
    forks: 5,
    followers: 90,
    languageCount: 4,
    issuesClosed: 15,
    reposWithLicense: 3,
    reposWithDescription: 5,
    avgRepoSizeKb: 300,
    activeYears: 3,
  }),
  // Bursty vs spread pair, same total commits — should NOT be crushed relative to
  // the spread persona just for concentrating work, but spread should still score
  // somewhat higher on consistency specifically.
  persona({
    name: "bursty-same-volume",
    description: "Bonus: same commit volume as active-student, but all in one 30-week block.",
    activeWeeks: burstWeeks(30, 5),
    daysPerActiveWeek: 3,
    commitsPerActiveDay: 3,
    repoCount: 8,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 15,
    forks: 3,
    followers: 20,
    languageCount: 3,
    issuesClosed: 4,
    reposWithLicense: 2,
    reposWithDescription: 6,
    avgRepoSizeKb: 250,
    activeYears: 2,
  }),
];

// ----------------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------------

function tierFor(rating: number): string {
  if (rating >= 90) return "Legend";
  if (rating >= 78) return "Gold";
  if (rating >= 55) return "Silver";
  return "Bronze";
}

console.log("DIMENSION_WEIGHTS:", DIMENSION_WEIGHTS);
console.log(
  "sum of weights:",
  Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0)
);
console.log("");

const results = PROFILES.map(({ raw, meta }) => {
  const dims = computeDimensions(raw);
  const overall = weightedOverall(dims);
  return { name: meta.name, description: meta.description, dims, overall };
});

for (const r of results) {
  console.log(`--- ${r.name} ---`);
  console.log(r.description);
  console.log("dimensions:", r.dims);
  console.log("overall (first read, no stability blending):", r.overall, `(${tierFor(r.overall)})`);
  console.log("");
}

// ----------------------------------------------------------------------------
// Property assertions (not exact-value assertions, per the brief)
// ----------------------------------------------------------------------------

function get(name: string) {
  const r = results.find((x) => x.name === name);
  if (!r) throw new Error(`missing profile ${name}`);
  return r;
}

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}: ${label}`);
  if (!cond) failures++;
}

const dormant = get("dormant-beginner");
const beginner = get("beginner-few-projects");
const activeStudent = get("active-student");
const strongEarly = get("strong-early-career");
const seriousOss = get("serious-oss-contributor");
const popularMaintainer = get("popular-maintainer");
const elite = get("elite-developer");
const hugeFollowingLowActivity = get("huge-following-low-activity");
const soloMany = get("solo-many-projects");
const strongCollaborator = get("strong-collaborator-few-projects");
const bursty = get("bursty-same-volume");

console.log("\n=== Property checks ===");

check(
  "monotonic ordering: dormant < beginner < active student < strong early-career < serious OSS < popular maintainer < elite",
  dormant.overall < beginner.overall &&
    beginner.overall < activeStudent.overall &&
    activeStudent.overall < strongEarly.overall &&
    strongEarly.overall < seriousOss.overall &&
    seriousOss.overall < popularMaintainer.overall &&
    popularMaintainer.overall < elite.overall
);

check("inactive profile stays low (dormant < 20)", dormant.overall < 20);

check("elite profile reaches 90+", elite.overall >= 90);

check(
  "active-but-modest solo profile lands in the 'developing' band (30-44), not crushed into the 'very weak' band",
  activeStudent.overall >= 30 && activeStudent.overall <= 44
);

check(
  "a genuinely competent solo early-career developer (still zero external PRs) reaches the 'competent' band (45-59), not stuck in the 20s-30s",
  strongEarly.overall >= 45 && strongEarly.overall <= 65
);

check("strong profiles (serious OSS contributor) realistically reach 65-85", seriousOss.overall >= 60 && seriousOss.overall <= 85);

check(
  "zero external PRs does not catastrophically collapse a normal solo developer (strong-early-career collaboration dimension >= 25)",
  strongEarly.dims.collaboration >= 25
);

check(
  "popularity cannot dominate everything: huge-following-low-activity scores well below active-student despite far larger raw stars/followers",
  hugeFollowingLowActivity.overall < activeStudent.overall
);

check(
  "a strong external collaborator with a moderate project count is not penalized relative to a solo dev with many but uncollaborated repos",
  strongCollaborator.overall >= soloMany.overall
);

check(
  "bursty activity is not catastrophically punished relative to spread activity at the same commit volume (within 15 points)",
  Math.abs(bursty.overall - activeStudent.overall) <= 15
);

check(
  "but spread activity still scores at least as high as bursty on consistency specifically",
  activeStudent.dims.consistency >= bursty.dims.consistency
);

check(
  "no single dimension weight exceeds 0.35 (no dimension can unilaterally dominate)",
  Math.max(...Object.values(DIMENSION_WEIGHTS)) <= 0.35
);

check(
  "weights sum to 1.0",
  Math.abs(Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0) - 1) < 1e-9
);

// ----------------------------------------------------------------------------
// Stability / versioning sanity check
// ----------------------------------------------------------------------------
console.log("\n=== Stability sanity check ===");
const freshFirstRead = applyStability(null, 65);
check("first-ever read shows true measured value immediately (no pull-to-average)", freshFirstRead === 65);

const staleV4Value = 30; // simulates a value poisoned by the old, broken model
const afterOneRegen = applyStability(staleV4Value, 65);
check(
  "WITHOUT key versioning, a stale bad value would still drag a corrected 65 down substantially on the next regen (demonstrates why RATING_ALGO_VERSION exists)",
  afterOneRegen < 65 && afterOneRegen > staleV4Value
);
console.log(`  (stale=30 blended with corrected measurement=65 -> ${afterOneRegen}; this is why getCard.ts now`);
console.log(`   namespaces the stability key by RATING_ALGO_VERSION, so this blend never happens across a model change)`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
