import type { RawGithubStats } from "./github";

// ============================================================================
// PRIMITIVES
// ============================================================================

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Diminishing-returns saturation curve. Smooth, asymptotic toward 100, reaches
 * exactly 50 at x = k. Used for every volume-based metric (commits, PRs, stars,
 * repos, issues) so raw count can never linearly buy rating — the 500th tiny
 * commit moves the needle far less than the 5th. k is chosen per-metric to mean
 * "the count at which you're already halfway maxed on this specific signal."
 */
export function saturate(x: number, k: number): number {
  const v = Math.max(0, x);
  return clamp(Math.round((100 * v) / (v + k)), 0, 100);
}

// ============================================================================
// DIMENSIONS
// ============================================================================
// Seven dimensions. Weights are not equal — each has a documented reason.
// Project Depth is intentionally low-weight: repo metadata (license, description,
// size) are weak, gameable proxies, not a real measurement of engineering quality.
// GitHub's public API cannot observe actual code quality, so we don't pretend to.
//
// CALIBRATION NOTE (v5): the v4 weights + curves systematically undervalued the
// population this product is actually for — students and solo builders with no
// external merged PRs. Two structural bugs drove real users from ~61/62 down to
// ~28/30 under v4:
//
//   1. Collaboration (20% of the total) was 75% driven by external-PR/review
//      volume and only 25% by a "solo building" fallback capped at repoCount=12.
//      Someone with zero external PRs — the overwhelming common case — could
//      score at most 25/100 on this dimension (0.25 * saturate(repoCount,12)
//      maxes at 25), which alone drags ~5 points off a 100-point overall before
//      any other dimension is considered. That's "a hard zero, with extra
//      steps," not the generous baseline the dimension's own comment claimed.
//   2. activeWeeksRatio() blended in a *days*-active ratio at 60% weight. Days
//      ratio is brutal for any real developer: someone who commits most weeks
//      but only 2-3 days within each active week (i.e. almost everyone) has
//      their consistency score crushed by the 60%-weighted daily-density term,
//      even though "active most weeks" is exactly what sustained-but-normal
//      activity looks like.
//
//   Both dimensions are real signals and stay — external collaboration and
//   genuine day-to-day consistency SHOULD matter — but neither should be able
//   to structurally cap out a normal, non-elite profile in the 20s/30s. v5
//   keeps the same seven dimensions and the same "absolute evidence, not
//   relative shape" philosophy, but recalibrates the curves and weights so a
//   competent, active-but-ordinary developer lands near 50, not near 30.

export interface Dimensions {
  engineeringActivity: number; // commits, long-term weighted — the primary signal
  collaboration: number; // PRs merged into repos you don't own, + reviews given, + solo-shipping baseline
  consistency: number; // weeks-active ratio, softened by a months-active floor — sustained > bursty
  projectDepth: number; // WEAK PROXY: license/description/size. Low weight, on purpose.
  impact: number; // stars/forks/followers — capped, heavily diminishing
  breadth: number; // distinct languages — diminishing hard past ~4-5
  community: number; // issues closed + distinct external repos contributed to
}

export const DIMENSION_WEIGHTS: Record<keyof Dimensions, number> = {
  engineeringActivity: 0.3, // raised from 0.25 — this should be the single strongest signal
  collaboration: 0.15, // lowered from 0.2 — real signal, but shouldn't structurally cap solo builders
  consistency: 0.14, // lowered from 0.15, formula also softened — see activeWeeksRatio
  projectDepth: 0.07, // deliberately low — see Dimensions doc comment
  impact: 0.13,
  breadth: 0.08, // lowered from 0.1 — supportive signal only, per spec
  community: 0.13, // raised from 0.1 — picks up slack from collaboration without the zero-PR cliff
};

function sumDailyRange(daily: { date: string; count: number }[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return daily.filter((d) => new Date(d.date).getTime() >= cutoff).reduce((sum, d) => sum + d.count, 0);
}

/**
 * Weeks-active ratio, softened by a months-active floor instead of a raw days-active
 * ratio. Months-active is much more forgiving of realistic, non-daily commit patterns
 * (nobody codes literally every day) while still telling bursty apart from sustained:
 * someone who worked hard for one 6-week sprint and vanished still reads as low
 * (few weeks, few months active), while someone who commits most weeks but not every
 * single day of those weeks is no longer punished for it.
 */
function activeWeeksRatio(daily: { date: string; count: number }[], windowDays = 365): number {
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
    const monthKey = d.date.slice(0, 7); // YYYY-MM
    totalMonths.add(monthKey);
    if (d.count > 0) {
      activeWeeks.add(String(weekKey));
      activeMonths.add(monthKey);
    }
  }
  if (totalWeeks.size === 0) return 0;
  const weeksRatio = activeWeeks.size / totalWeeks.size;
  const monthsRatio = totalMonths.size > 0 ? activeMonths.size / totalMonths.size : 0;
  // Weeks-active carries most of the weight (it's the real "did you show up"
  // signal); months-active is a gentler secondary check that spread-out work
  // beats one concentrated burst, without demanding near-daily activity.
  return weeksRatio * 0.65 + monthsRatio * 0.35;
}

/** The long-term, absolute-evidence dimension set that feeds Overall. */
export function computeDimensions(raw: RawGithubStats): Dimensions {
  const commits365 = sumDailyRange(raw.dailyContributions, 365);

  const engineeringActivity = saturate(commits365, 280);

  // External collaboration is a strong signal, but must not be the only path to a
  // decent collaboration score — the overwhelming majority of students and solo
  // builders (this product's actual population) have zero PRs merged into repos
  // they don't own. The solo-shipping baseline is tied to BOTH repo count and
  // recent commit volume (not repo count alone, which is trivially gameable by
  // creating empty repos) so it credits real, sustained solo output. External
  // collaboration is still worth more per unit of evidence — a few real merged
  // PRs elsewhere can outscore a much bigger pile of solo repos — but zero
  // external PRs now reads as "still building," landing in the 30s-50s for an
  // active solo developer, not capped at 25.
  const externalCollab = saturate(raw.pullRequestsMergedToOthers * 3 + raw.reviews, 30);
  const soloBuildingRaw = raw.repoCount * 2 + commits365 / 50;
  const soloBuilding = saturate(soloBuildingRaw, 14);
  const collaboration = Math.round(externalCollab * 0.55 + soloBuilding * 0.45);

  const consistency = Math.round(activeWeeksRatio(raw.dailyContributions, 365) * 100);

  // Weak proxies, deliberately capped in how much they can swing this dimension even
  // internally — a repo with a license and a description isn't "deep", it's just tidy.
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

export function weightedOverall(dims: Dimensions): number {
  const raw = (Object.keys(dims) as (keyof Dimensions)[]).reduce(
    (sum, key) => sum + dims[key] * DIMENSION_WEIGHTS[key],
    0
  );
  return clamp(Math.round(raw), 0, 100);
}

// ============================================================================
// FORM — recency-weighted, separate from Overall by construction
// ============================================================================
// Form only uses the two dimensions that meaningfully have a "right now" — activity
// and consistency. A star earned 400 days ago doesn't have a "current form"; whether
// you shipped code this week does. Deliberately NOT a recomputation of all 7
// dimensions on a shorter window — that would smuggle recency into things like
// Breadth or Impact where "recent" isn't a coherent concept.

export function computeForm(raw: RawGithubStats): number {
  const commits30 = sumDailyRange(raw.dailyContributions, 30);
  const commits90 = sumDailyRange(raw.dailyContributions, 90);
  const recentConsistency = activeWeeksRatio(raw.dailyContributions, 90);

  const form = saturate(commits30, 25) * 0.5 + saturate(commits90, 75) * 0.3 + recentConsistency * 100 * 0.2;
  return clamp(Math.round(form), 0, 100);
}

// ============================================================================
// STABILITY — replaces confidence-pull-to-50.
// ============================================================================
// A brand new account with no prior stored rating shows its true measured value
// immediately — a genuinely strong new profile is NOT dragged toward "average" just
// for being new. Once a rating exists, each new measurement moves the displayed
// rating partway toward the fresh evidence rather than replacing it outright, so a
// single noisy/cached read can't whipsaw the number. PERSISTENCE=0.6 means each
// regeneration closes about 40% of the gap to the current true measurement — a real,
// sustained change is clearly visible within 2-3 regenerations; a one-off blip mostly
// washes out.

const PERSISTENCE = 0.6;

export function applyStability(previousRating: number | null, measuredRating: number): number {
  if (previousRating === null) return measuredRating;
  return clamp(Math.round(previousRating * PERSISTENCE + measuredRating * (1 - PERSISTENCE)), 0, 100);
}

// ============================================================================
// DEBUG VISIBILITY (dev-only) — section 8 of the calibration brief.
// ============================================================================
// Not wired into any UI route. Import this from a throwaway script (see
// scripts/calibrate-rating.ts and scripts/regression-two-users.ts) or a local
// `node -e`/tsx one-liner during development to see exactly how a raw profile
// turns into a displayed rating. Deliberately excludes anything secret (no
// tokens, no Redis contents) — it only echoes back numbers already derived
// from the public raw stats passed in.
export interface RatingDebugTrace {
  rawSummary: Pick<
    RawGithubStats,
    "commits" | "repoCount" | "pullRequestsMergedToOthers" | "reviews" | "stars" | "forks" | "followers" | "languageCount" | "issuesClosed"
  >;
  dimensions: Dimensions;
  dimensionWeights: Record<keyof Dimensions, number>;
  weightedContribution: Record<keyof Dimensions, number>; // dims[key] * weight, pre-rounding
  measuredOverall: number; // weightedOverall(dims), before stability
  previousRating: number | null;
  stabilizedOverall: number; // after applyStability
  finalDisplayRating: number; // after the *0.99 "out of 99" display scale
  tier: "Bronze" | "Silver" | "Gold" | "Legend";
}

export function traceRating(raw: RawGithubStats, previousRating: number | null): RatingDebugTrace {
  const dimensions = computeDimensions(raw);
  const measuredOverall = weightedOverall(dimensions);
  const stabilizedOverall = applyStability(previousRating, measuredOverall);
  const finalDisplayRating = clamp(Math.round(stabilizedOverall * 0.99), 0, 99);
  const tier: RatingDebugTrace["tier"] =
    finalDisplayRating >= 90 ? "Legend" : finalDisplayRating >= 78 ? "Gold" : finalDisplayRating >= 55 ? "Silver" : "Bronze";

  const weightedContribution = {} as Record<keyof Dimensions, number>;
  for (const key of Object.keys(dimensions) as (keyof Dimensions)[]) {
    weightedContribution[key] = Math.round(dimensions[key] * DIMENSION_WEIGHTS[key] * 100) / 100;
  }

  return {
    rawSummary: {
      commits: raw.commits,
      repoCount: raw.repoCount,
      pullRequestsMergedToOthers: raw.pullRequestsMergedToOthers,
      reviews: raw.reviews,
      stars: raw.stars,
      forks: raw.forks,
      followers: raw.followers,
      languageCount: raw.languageCount,
      issuesClosed: raw.issuesClosed,
    },
    dimensions,
    dimensionWeights: DIMENSION_WEIGHTS,
    weightedContribution,
    measuredOverall,
    previousRating,
    stabilizedOverall,
    finalDisplayRating,
    tier,
  };
}
