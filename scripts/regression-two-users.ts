/**
 * Regression check for the reported 61/62 -> 30/28 drop (brief section 7).
 *
 * IMPORTANT CAVEAT: this repo snapshot has no GITHUB_TOKEN configured in this
 * environment and no git history, so the two real usernames' actual raw GitHub
 * metrics cannot be fetched here, and their pre-regression ratings are not
 * hardcoded (per the brief's explicit instruction not to hardcode old ratings).
 * Instead, this script reconstructs a REPRESENTATIVE profile shape consistent
 * with "scored ~61/62 under the old model" — a solid, active, mostly-solo
 * developer with no/minimal external merged PRs, which is exactly the profile
 * shape the v4 audit (see lib/rating.ts comments) identified as the systematically
 * undervalued population — and runs it through both the OLD (v4) and NEW (v5)
 * dimension math side by side.
 *
 * To regression-test the ACTUAL two accounts once network/token access is
 * available: call fetchGithubStats(realUsername) from lib/github.ts, feed the
 * result into both computeDimensionsV4Reconstruction() below and the live
 * computeDimensions() in lib/rating.ts, and compare — the harness below is
 * built so that swap is a one-line change (replace the `persona(...)` raw
 * object with a real fetched RawGithubStats).
 *
 * Run with: npx tsx scripts/regression-two-users.ts
 */
import { computeDimensions as computeDimensionsV5, weightedOverall, saturate } from "../lib/rating";
import type { RawGithubStats } from "../lib/github";
import type { Dimensions } from "../lib/rating";

// ----------------------------------------------------------------------------
// OLD (v4) dimension math, reconstructed verbatim from the pre-fix lib/rating.ts
// for side-by-side comparison only. This is NOT imported/used anywhere in the
// live app — it exists purely so this script can show old-vs-new on the same
// input.
// ----------------------------------------------------------------------------

function sumDailyRangeV4(daily: { date: string; count: number }[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return daily.filter((d) => new Date(d.date).getTime() >= cutoff).reduce((sum, d) => sum + d.count, 0);
}

function activeWeeksRatioV4(daily: { date: string; count: number }[], windowDays = 365): number {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const activeWeeks = new Set<string>();
  const totalWeeks = new Set<string>();
  const activeDays = new Set<string>();
  const totalDays = new Set<string>();
  for (const d of daily) {
    const time = new Date(d.date).getTime();
    if (time < cutoff) continue;
    const weekKey = Math.floor(time / (7 * 24 * 60 * 60 * 1000));
    totalWeeks.add(String(weekKey));
    totalDays.add(d.date);
    if (d.count > 0) {
      activeWeeks.add(String(weekKey));
      activeDays.add(d.date);
    }
  }
  if (totalWeeks.size === 0) return 0;
  const weeksRatio = activeWeeks.size / totalWeeks.size;
  const daysRatio = totalDays.size > 0 ? activeDays.size / totalDays.size : 0;
  return weeksRatio * 0.4 + daysRatio * 0.6;
}

const DIMENSION_WEIGHTS_V4: Record<keyof Dimensions, number> = {
  engineeringActivity: 0.25,
  collaboration: 0.2,
  consistency: 0.15,
  projectDepth: 0.08,
  impact: 0.12,
  breadth: 0.1,
  community: 0.1,
};

function computeDimensionsV4(raw: RawGithubStats): Dimensions {
  const commits365 = sumDailyRangeV4(raw.dailyContributions, 365);
  const engineeringActivity = saturate(commits365, 300);
  const externalCollab = saturate(raw.pullRequestsMergedToOthers * 3 + raw.reviews, 40);
  const soloBuilding = saturate(raw.repoCount, 12);
  const collaboration = Math.round(externalCollab * 0.75 + soloBuilding * 0.25);
  const consistency = Math.round(activeWeeksRatioV4(raw.dailyContributions, 365) * 100);
  const depthSignal =
    saturate(raw.reposWithLicense, 4) * 0.3 +
    saturate(raw.reposWithDescription, 6) * 0.3 +
    saturate(raw.avgRepoSizeKb, 500) * 0.4;
  const projectDepth = Math.round(depthSignal);
  const impact = saturate(raw.stars + raw.forks * 2 + raw.followers * 0.5, 150);
  const breadth = saturate(raw.languageCount, 4);
  const community = saturate(raw.issuesClosed + raw.pullRequestsMergedToOthers * 2, 20);
  return { engineeringActivity, collaboration, consistency, projectDepth, impact, breadth, community };
}

function weightedOverallV4(dims: Dimensions): number {
  const raw = (Object.keys(dims) as (keyof Dimensions)[]).reduce(
    (sum, key) => sum + dims[key] * DIMENSION_WEIGHTS_V4[key],
    0
  );
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ----------------------------------------------------------------------------
// Representative reconstruction of the two affected profiles: real, active,
// mostly-solo developers — commits most weeks but not every single day of
// those weeks, a healthy repo count, no/minimal external merged PRs, modest
// but real stars/followers. This is the exact shape the audit identified as
// what v4 was crushing to ~28-30.
// ----------------------------------------------------------------------------

function buildDaily(activeWeeksOutOf52: number, daysPerActiveWeek: number, commitsPerDay: number) {
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  const step = 52 / activeWeeksOutOf52;
  const activeWeekSet = new Set<number>();
  for (let i = 0; i < activeWeeksOutOf52; i++) activeWeekSet.add(Math.min(51, Math.round(i * step)));
  for (let week = 0; week < 52; week++) {
    const isActive = activeWeekSet.has(week);
    for (let day = 0; day < 7; day++) {
      const daysAgo = (51 - week) * 7 + (6 - day);
      const d = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const date = d.toISOString().slice(0, 10);
      const count = isActive && day < daysPerActiveWeek ? commitsPerDay : 0;
      out.push({ date, count });
    }
  }
  return out;
}

function makeUser(name: string, opts: {
  activeWeeks: number;
  daysPerActiveWeek: number;
  commitsPerDay: number;
  repoCount: number;
  externalPRs: number;
  reviews: number;
  stars: number;
  forks: number;
  followers: number;
  languageCount: number;
  issuesClosed: number;
  activeYears: number;
}): RawGithubStats {
  const dailyContributions = buildDaily(opts.activeWeeks, opts.daysPerActiveWeek, opts.commitsPerDay);
  const commits = dailyContributions.reduce((s, d) => s + d.count, 0);
  return {
    login: name,
    name,
    avatarUrl: "",
    createdAt: new Date(Date.now() - opts.activeYears * 365 * 24 * 60 * 60 * 1000).toISOString(),
    followers: opts.followers,
    commits,
    pullRequests: opts.externalPRs + 3,
    pullRequestsMerged: opts.externalPRs,
    pullRequestsMergedToOthers: opts.externalPRs,
    issues: Math.round(opts.issuesClosed * 0.7),
    issuesClosed: opts.issuesClosed,
    reviews: opts.reviews,
    stars: opts.stars,
    forks: opts.forks,
    repoCount: opts.repoCount,
    activeYears: opts.activeYears,
    topLanguage: "TypeScript",
    languageCount: opts.languageCount,
    bio: null,
    dailyContributions,
    reposWithLicense: Math.min(opts.repoCount, 5),
    reposWithDescription: Math.min(opts.repoCount, Math.round(opts.repoCount * 0.8)),
    avgRepoSizeKb: 350,
  };
}

const userA = makeUser("regression-user-a", {
  activeWeeks: 34,
  daysPerActiveWeek: 2, // active most weeks, but not every day within them — realistic, not lazy
  commitsPerDay: 3,
  repoCount: 9,
  externalPRs: 0, // "no external merged PRs" — explicitly called out in the brief as the trigger case
  reviews: 0,
  stars: 35,
  forks: 5,
  followers: 45,
  languageCount: 3,
  issuesClosed: 5,
  activeYears: 3,
});

const userB = makeUser("regression-user-b", {
  activeWeeks: 36,
  daysPerActiveWeek: 2,
  commitsPerDay: 2,
  repoCount: 7,
  externalPRs: 0,
  reviews: 0,
  stars: 28,
  forks: 3,
  followers: 32,
  languageCount: 3,
  issuesClosed: 3,
  activeYears: 2,
});

for (const [label, raw] of [
  ["User A (representative of the ~61 profile)", userA],
  ["User B (representative of the ~62 profile)", userB],
] as const) {
  console.log(`\n=== ${label} ===`);
  console.log("raw metrics:", {
    commits: raw.commits,
    repoCount: raw.repoCount,
    externalPRs: raw.pullRequestsMergedToOthers,
    stars: raw.stars,
    followers: raw.followers,
  });

  const dimsV4 = computeDimensionsV4(raw);
  const overallV4 = weightedOverallV4(dimsV4);
  console.log("v4 (OLD, broken) dimensions:", dimsV4);
  console.log("v4 (OLD, broken) overall:", overallV4);

  const dimsV5 = computeDimensionsV5(raw);
  const overallV5 = weightedOverall(dimsV5);
  console.log("v5 (NEW, fixed) dimensions:", dimsV5);
  console.log("v5 (NEW, fixed) overall:", overallV5);

  console.log(`delta: ${overallV5 - overallV4} points recovered`);
}

console.log(
  "\nNote: these are reconstructed representative profiles calibrated to reproduce the REPORTED SYMPTOM"
);
console.log(
  "(v4 landing in the high-20s/low-30s for an active, mostly-solo, zero-external-PR developer), not"
);
console.log(
  "the real accounts themselves — see the file header for why, and how to swap in real fetched data."
);
