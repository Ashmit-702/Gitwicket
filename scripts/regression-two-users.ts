/**
 * Regression check for the reported 37/33 plateau (v6 brief, "THE TWO REAL
 * REGRESSION USERS").
 *
 * CAVEAT (same as before): this environment has no GITHUB_TOKEN/git history,
 * so the two real usernames' actual raw metrics can't be fetched here. This
 * reconstructs a REPRESENTATIVE profile shape consistent with "scored ~61/62
 * under the original model, dropped to ~28/30 under v4, recovered only to
 * ~33/37 under the v5 fix" and runs it through v5 math and the new v6
 * pipeline side by side, to show the delta comes from the architecture change
 * (neutral baselines + calibration curve), not from padding.
 *
 * To regression-test the ACTUAL accounts once network/token access is
 * available: fetch real RawGithubStats and feed it into both
 * computeDimensionsV5Reconstruction() and the live computeDimensions() in
 * lib/rating.ts.
 *
 * Run with: npx tsx scripts/regression-two-users.ts (or: npm run test:rating:regression)
 */
import {
  computeDimensions as computeDimensionsV6,
  weightedRawScore,
  applyCalibrationCurve,
  saturate,
  saturateFromFloor,
} from "../lib/rating";
import type { RawGithubStats } from "../lib/github";
import type { Dimensions } from "../lib/rating";

// ----------------------------------------------------------------------------
// v5 dimension math, reconstructed verbatim from the last delivered version,
// for side-by-side comparison only. Not imported/used anywhere in the live app.
// ----------------------------------------------------------------------------

function sumDailyRangeV5(daily: { date: string; count: number }[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return daily.filter((d) => new Date(d.date).getTime() >= cutoff).reduce((sum, d) => sum + d.count, 0);
}

function activeWeeksRatioV5(daily: { date: string; count: number }[], windowDays = 365): number {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const activeWeeks = new Set<string>();
  const totalWeeks = new Set<string>();
  const activeMonths = new Set<string>();
  const totalMonths = new Set<string>();
  for (const d of daily) {
    const time = new Date(d.date).getTime();
    if (time < cutoff) continue;
    const weekKey = Math.floor(time / (7 * 24 * 60 * 60 * 1000));
    totalWeeks.add(String(weekKey));
    const monthKey = d.date.slice(0, 7);
    totalMonths.add(monthKey);
    if (d.count > 0) {
      activeWeeks.add(String(weekKey));
      activeMonths.add(monthKey);
    }
  }
  if (totalWeeks.size === 0) return 0;
  const weeksRatio = activeWeeks.size / totalWeeks.size;
  const monthsRatio = totalMonths.size > 0 ? activeMonths.size / totalMonths.size : 0;
  return weeksRatio * 0.65 + monthsRatio * 0.35;
}

type DimensionsV5 = {
  engineeringActivity: number;
  collaboration: number;
  consistency: number;
  projectDepth: number;
  impact: number;
  breadth: number;
  community: number;
};

const DIMENSION_WEIGHTS_V5: Record<keyof DimensionsV5, number> = {
  engineeringActivity: 0.3,
  collaboration: 0.15,
  consistency: 0.14,
  projectDepth: 0.07,
  impact: 0.13,
  breadth: 0.08,
  community: 0.13,
};

function computeDimensionsV5(raw: RawGithubStats): DimensionsV5 {
  const commits365 = sumDailyRangeV5(raw.dailyContributions, 365);
  const engineeringActivity = saturate(commits365, 280);
  const externalCollab = saturate(raw.pullRequestsMergedToOthers * 3 + raw.reviews, 30);
  const soloBuildingRaw = raw.repoCount * 2 + commits365 / 50;
  const soloBuilding = saturate(soloBuildingRaw, 14);
  const collaboration = Math.round(externalCollab * 0.55 + soloBuilding * 0.45);
  const consistency = Math.round(activeWeeksRatioV5(raw.dailyContributions, 365) * 100);
  const depthSignal =
    saturate(raw.reposWithLicense, 4) * 0.3 +
    saturate(raw.reposWithDescription, 6) * 0.3 +
    saturate(raw.avgRepoSizeKb, 500) * 0.4;
  const projectDepth = Math.round(depthSignal);
  const impact = saturate(raw.stars + raw.forks * 2 + raw.followers * 0.5, 150);
  const breadth = saturate(raw.languageCount, 5);
  const community = saturate(raw.issuesClosed + raw.pullRequestsMergedToOthers * 2, 18);
  return { engineeringActivity, collaboration, consistency, projectDepth, impact, breadth, community };
}

function weightedOverallV5(dims: DimensionsV5): number {
  const raw = (Object.keys(dims) as (keyof DimensionsV5)[]).reduce(
    (sum, key) => sum + dims[key] * DIMENSION_WEIGHTS_V5[key],
    0
  );
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ----------------------------------------------------------------------------
// Representative reconstruction: real, active, mostly-solo developers, no
// external PRs — same shape as before, tuned so v5 lands at ~33/37.
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

function makeUser(
  name: string,
  opts: {
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
  }
): RawGithubStats {
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
  activeWeeks: 30,
  daysPerActiveWeek: 2,
  commitsPerDay: 3,
  repoCount: 9,
  externalPRs: 0,
  reviews: 0,
  stars: 22,
  forks: 3,
  followers: 28,
  languageCount: 3,
  issuesClosed: 3,
  activeYears: 3,
});

const userB = makeUser("regression-user-b", {
  activeWeeks: 32,
  daysPerActiveWeek: 2,
  commitsPerDay: 2,
  repoCount: 7,
  externalPRs: 0,
  reviews: 0,
  stars: 15,
  forks: 2,
  followers: 18,
  languageCount: 3,
  issuesClosed: 2,
  activeYears: 2,
});

for (const [label, raw] of [
  ["User A (representative of the ~67 GitFut / ~37 GitWicket profile)", userA],
  ["User B (representative of the ~61 GitFut / ~33 GitWicket profile)", userB],
] as const) {
  console.log(`\n=== ${label} ===`);
  console.log("raw metrics:", {
    commits: raw.commits,
    repoCount: raw.repoCount,
    externalPRs: raw.pullRequestsMergedToOthers,
    stars: raw.stars,
    followers: raw.followers,
  });

  const dimsV5 = computeDimensionsV5(raw);
  const overallV5 = weightedOverallV5(dimsV5);
  console.log("v5 (previous fix) dimensions:", dimsV5);
  console.log("v5 (previous fix) overall:", overallV5);

  const dimsV6 = computeDimensionsV6(raw);
  const stage1 = weightedRawScore(dimsV6);
  const overallV6 = applyCalibrationCurve(stage1);
  console.log("v6 (this recalibration) dimensions:", dimsV6);
  console.log(`v6 stage1 raw score: ${Math.round(stage1 * 10) / 10}  ->  calibrated overall: ${overallV6}`);

  console.log(`delta: ${overallV6 - overallV5} points recovered`);
}

console.log(
  "\nNote: reconstructed representative profiles tuned to reproduce the REPORTED SYMPTOM (v5 landing"
);
console.log(
  "in the low-to-mid-30s for an active, mostly-solo, zero-external-PR developer), not the real accounts"
);
console.log("themselves. GitFut's ~67/~61 are cited only as external sanity checks, not as targets — see");
console.log("the file header and lib/rating.ts for why the correction doesn't chase that number directly.");
console.log(
  `\n(saturateFromFloor sanity: 0 external PRs -> collaboration = ${saturateFromFloor(0, 22, 46)} (neutral, not 0); ` +
    `10 merged PRs -> ${saturateFromFloor(10 * 3, 22, 46)})`
);
