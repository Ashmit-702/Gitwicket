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

/**
 * Same shape as saturate(), but the curve starts from `floor` instead of 0 and
 * only the remaining headroom (floor..100) saturates with evidence. This is
 * the "absence of evidence is not evidence of weakness" primitive: used for
 * dimensions where zero raw signal is a NEUTRAL state (most developers simply
 * haven't done this optional thing yet), not a failure state. x=0 returns
 * exactly `floor`; more evidence climbs from there toward 100 exactly like
 * saturate() would, just rebased.
 */
export function saturateFromFloor(x: number, k: number, floor: number): number {
  const headroom = 100 - floor;
  return clamp(Math.round(floor + (headroom * saturate(x, k)) / 100), 0, 100);
}

// ============================================================================
// DIMENSIONS
// ============================================================================
//
// CALIBRATION HISTORY:
//   v4 (original):  two real users scoring ~61/62 dropped to ~28/30. Root cause:
//     collaboration was 75% driven by external-PR volume with only a 25%-weighted,
//     capped-at-25 solo fallback, and consistency blended in a brutal days-active
//     ratio at 60% weight. Both structurally capped normal, non-elite profiles.
//   v5 (first fix):  softened the same two dimensions (blended solo-building
//     credit into collaboration, swapped days-ratio for months-ratio in
//     consistency) and reweighted. This *helped* — the same two users moved from
//     ~28/30 to ~33/37 — but the fundamental complaint remained: a genuinely
//     competent, active developer with no external PRs was still landing in the
//     30s, a full tier below where the evidence supports. Two things were still
//     wrong even after v5's fix:
//       1. v5 still treated "0 external PRs" as a LOW score to climb from (just a
//          less punishing one) rather than a NEUTRAL score. Missing optional
//          evidence was still modeled as weakness, just weakness with a softer
//          floor — the wrong shape, not just the wrong magnitude.
//       2. v5 kept projectDepth (real project ownership evidence) at a
//          deliberately tiny 7% weight, on the theory that repo metadata is a
//          weak proxy for code quality. True, but the fix for "weak proxy" is to
//          not over-claim precision from it — not to make it nearly worthless.
//          Owned, described, non-trivial repos are real backbone evidence of
//          "this person builds things," which is exactly what this product needs
//          to reward for the solo-builder population it serves.
//
//   v6 (this version) makes two architectural changes rather than another round
//   of constant-tweaking:
//
//   A. NEUTRAL BASELINES, not soft floors. Dimensions built entirely from
//      *optional* evidence — Collaboration (external PRs/reviews) and Community
//      (issues closed, external contribution count) — now use
//      saturateFromFloor() with floor ~= a genuinely neutral midpoint (38-46),
//      not 0. Zero external PRs reads as "no evidence of external collaboration,"
//      landing near the middle of that dimension's range, exactly as it should —
//      not as a penalty dressed up as a smaller penalty. Positive evidence still
//      climbs meaningfully above neutral; there is no such thing as negative
//      collaboration evidence to push it below neutral.
//   B. Project Strength (renamed from Project Depth) is promoted to a real
//      backbone dimension (22%, up from 7%), and its formula now leans more on
//      genuine ownership signal (repo count with diminishing returns, tied
//      loosely to commit activity so empty repos don't count) alongside the
//      existing license/description/size tidiness proxies — while still capping
//      any single sub-signal so it can't be gamed by e.g. mass-creating repos.
//
//   Stage 1 (this section) produces a defensible ABSOLUTE developer-strength
//   score in the 0-100 range from real evidence. Stage 2 (CALIBRATION CURVE,
//   below) maps that absolute score onto the 0-99 GitWicket scale via an
//   explicit, tested, monotonic curve — rather than trying to force dimension
//   weights themselves to produce the right final distribution. See
//   scripts/calibrate-rating.ts for the benchmark population this curve was
//   fitted against.

export interface Dimensions {
  engineeringActivity: number; // commits, long-term weighted — the primary signal
  projectStrength: number; // owned/non-fork repos: count (diminishing), tidiness proxies — real backbone evidence
  consistency: number; // multi-horizon activity spread — sustained > bursty, without punishing a quiet stretch
  collaboration: number; // PRs merged into repos you don't own, + reviews — NEUTRAL baseline, not zero, at no evidence
  impact: number; // stars/forks/followers — capped, heavily diminishing
  breadth: number; // distinct languages — diminishing hard past ~3-4
  community: number; // issues closed + external contribution count — NEUTRAL baseline, not zero, at no evidence
}

export const DIMENSION_WEIGHTS: Record<keyof Dimensions, number> = {
  engineeringActivity: 0.28,
  projectStrength: 0.22, // promoted from a 7%-weight "weak proxy" to a real backbone dimension — see v6 note above
  consistency: 0.15,
  impact: 0.12,
  collaboration: 0.1, // neutral-baseline curve now — see saturateFromFloor
  breadth: 0.08,
  community: 0.05, // supportive signal only; neutral-baseline curve — see saturateFromFloor
};

function sumDailyRange(daily: { date: string; count: number }[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return daily.filter((d) => new Date(d.date).getTime() >= cutoff).reduce((sum, d) => sum + d.count, 0);
}

function weeksActiveInRange(
  daily: { date: string; count: number }[],
  startDaysAgo: number,
  endDaysAgo: number
): { active: number; total: number } {
  const now = Date.now();
  const start = now - startDaysAgo * 24 * 60 * 60 * 1000;
  const end = now - endDaysAgo * 24 * 60 * 60 * 1000;
  const activeWeeks = new Set<string>();
  const totalWeeks = new Set<string>();
  for (const d of daily) {
    const time = new Date(d.date).getTime();
    if (time < start || time >= end) continue;
    const weekKey = Math.floor(time / (7 * 24 * 60 * 60 * 1000));
    totalWeeks.add(String(weekKey));
    if (d.count > 0) activeWeeks.add(String(weekKey));
  }
  return { active: activeWeeks.size, total: totalWeeks.size };
}

/**
 * Multi-horizon consistency: blends a full-year weeks-active ratio with the
 * BEST 13-week (~quarter) window anywhere in that year. This is the fix for
 * "worked hard for 3 months, then paused" — a rolling-window max means one
 * genuinely solid quarter is credited on its own terms, instead of being
 * averaged down by quiet months on either side of it. The full-year ratio
 * still anchors the score so a single good quarter alone can't fully simulate
 * year-round consistency — it lifts the floor, it doesn't max the dimension.
 */
function computeConsistency(daily: { date: string; count: number }[]): number {
  const year = weeksActiveInRange(daily, 365, 0);
  const yearRatio = year.total > 0 ? year.active / year.total : 0;

  let bestQuarterRatio = 0;
  const WINDOW_WEEKS = 13;
  for (let startWeek = 0; startWeek <= 52 - WINDOW_WEEKS; startWeek++) {
    const startDaysAgo = 365 - startWeek * 7;
    const endDaysAgo = Math.max(0, startDaysAgo - WINDOW_WEEKS * 7);
    const { active, total } = weeksActiveInRange(daily, startDaysAgo, endDaysAgo);
    if (total > 0) bestQuarterRatio = Math.max(bestQuarterRatio, active / total);
  }

  const blended = yearRatio * 0.6 + bestQuarterRatio * 0.4;
  return clamp(Math.round(blended * 100), 0, 100);
}

/** The long-term, absolute-evidence dimension set that feeds Overall (Stage 1). */
export function computeDimensions(raw: RawGithubStats): Dimensions {
  const commits365 = sumDailyRange(raw.dailyContributions, 365);

  // First real activity should move this fast; extreme volume saturates hard —
  // 250 commits/year (roughly a working day a week, every week) already
  // reaches the midpoint.
  const engineeringActivity = saturate(commits365, 250);

  // Real ownership evidence: repo count (tied loosely to commit activity so
  // empty/abandoned repos can't just be mass-created for credit), blended with
  // the existing tidiness proxies (license, description, realistic size). Repo
  // count alone caps its own sub-contribution so it can't dominate the dimension.
  const ownershipRaw = raw.repoCount + Math.min(raw.repoCount, commits365 / 40);
  const ownership = saturate(ownershipRaw, 10);
  const tidiness =
    saturate(raw.reposWithLicense, 4) * 0.3 +
    saturate(raw.reposWithDescription, 6) * 0.3 +
    saturate(raw.avgRepoSizeKb, 400) * 0.4;
  const projectStrength = Math.round(ownership * 0.6 + tidiness * 0.4);

  const consistency = computeConsistency(raw.dailyContributions);

  // NEUTRAL baseline at 46: zero external PRs/reviews is the median, expected
  // state for this product's population, not a red flag. A handful of real
  // merged PRs elsewhere climbs meaningfully above neutral; heavy sustained
  // external collaboration approaches 100.
  const collaboration = saturateFromFloor(raw.pullRequestsMergedToOthers * 3 + raw.reviews, 22, 46);

  const impact = saturate(raw.stars + raw.forks * 2 + raw.followers * 0.5, 140);

  const breadth = saturate(raw.languageCount, 4);

  // NEUTRAL baseline at 38 (slightly lower than collaboration's — issue triage
  // and external contribution are a bit rarer/more discretionary even for
  // engaged solo builders): zero closed issues / external contributions is
  // expected, not damning.
  const community = saturateFromFloor(raw.issuesClosed + raw.pullRequestsMergedToOthers * 2, 16, 38);

  return { engineeringActivity, projectStrength, consistency, collaboration, impact, breadth, community };
}

/** Stage 1 output: the absolute, weighted developer-strength score, 0-100. */
export function weightedRawScore(dims: Dimensions): number {
  const raw = (Object.keys(dims) as (keyof Dimensions)[]).reduce(
    (sum, key) => sum + dims[key] * DIMENSION_WEIGHTS[key],
    0
  );
  return clamp(raw, 0, 100);
}

// ============================================================================
// STAGE 2 — CALIBRATION CURVE
// ============================================================================
// The Stage 1 weighted-dimension score naturally clusters in a fairly narrow
// band (roughly 25-80 across the whole realistic population, per the benchmark
// suite in scripts/calibrate-rating.ts) because every dimension is itself a
// saturating curve — averaging several saturating curves compresses the tails
// further. Rather than fight that by cranking individual dimension weights
// until the *average* happens to come out right (which is what v4/v5 both
// did, and why they kept landing in a too-compressed 20s-30s-for-everyone-
// decent band), Stage 2 explicitly maps the Stage 1 score onto the target
// 0-99 GitWicket distribution with a monotonic piecewise-linear curve.
//
// Control points below were fitted against the 15-profile benchmark suite
// (scripts/calibrate-rating.ts) so that:
//   - a dormant/near-empty profile stays under 20
//   - a beginner lands in the 25-39 "weak" band
//   - an active-but-unremarkable solo developer (the modal user of this
//     product) lands in the 45-59 "competent" band, NOT the 30s
//   - a strong professional/serious contributor reaches 65-80
//   - an excellent, broad-evidence profile reaches 80-89
//   - only a profile with elite, sustained evidence across nearly every
//     dimension reaches 90+
// The curve is monotonic strictly increasing by construction (each Y is
// >= the previous), which guarantees the required mathematical property:
// more evidence in any dimension can only move the Stage 1 score up, and the
// curve never maps a higher Stage 1 score to a lower output.
const CALIBRATION_CURVE: [number, number][] = [
  [0, 0],
  [15, 14],
  [25, 24],
  [35, 34],
  [42, 44],
  [48, 52],
  [54, 60],
  [60, 67],
  [66, 73],
  [72, 79],
  [78, 85],
  [84, 90],
  [90, 94],
  [95, 97],
  [100, 99],
];

/**
 * Piecewise-linear interpolation through CALIBRATION_CURVE. Strictly
 * monotonic non-decreasing by construction (every consecutive Y is >= the
 * previous), so this can never turn "more evidence" into "a lower rating."
 */
export function applyCalibrationCurve(rawScore: number): number {
  const x = clamp(rawScore, 0, 100);
  for (let i = 0; i < CALIBRATION_CURVE.length - 1; i++) {
    const [x0, y0] = CALIBRATION_CURVE[i];
    const [x1, y1] = CALIBRATION_CURVE[i + 1];
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return clamp(Math.round(y0 + t * (y1 - y0)), 0, 99);
    }
  }
  return 99;
}

/** Full Stage 1 + Stage 2 pipeline: absolute dimensions -> calibrated 0-99 rating. */
export function weightedOverall(dims: Dimensions): number {
  return applyCalibrationCurve(weightedRawScore(dims));
}

// ============================================================================
// FORM — recency-weighted, separate from Overall by construction
// ============================================================================
// Form only uses the two dimensions that meaningfully have a "right now" — activity
// and consistency. A star earned 400 days ago doesn't have a "current form"; whether
// you shipped code this week does. Deliberately NOT a recomputation of all
// dimensions on a shorter window — that would smuggle recency into things like
// Breadth or Impact where "recent" isn't a coherent concept. Form is intentionally
// NOT run through the Stage 2 calibration curve — it's a secondary, relative
// "how hot is your current activity" indicator, not a claim about overall strength.

export function computeForm(raw: RawGithubStats): number {
  const commits30 = sumDailyRange(raw.dailyContributions, 30);
  const commits90 = sumDailyRange(raw.dailyContributions, 90);
  const recent = weeksActiveInRange(raw.dailyContributions, 90, 0);
  const recentConsistency = recent.total > 0 ? recent.active / recent.total : 0;

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
//
// This is paired with RATING_ALGORITHM_VERSION in lib/getCard.ts, which namespaces
// the stored stability state by algorithm version — see that file. Without it, a
// rating computed under a since-corrected model (v4, v5) would keep getting blended
// into every new measurement under PERSISTENCE=0.6 forever, since there's no TTL on
// that state. That was flagged as a risk after v5 and is exactly what would have
// re-contaminated this v6 recalibration if the version hadn't been bumped again.

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
  stage1RawScore: number; // weightedRawScore(dims), 0-100, before the calibration curve
  measuredOverall: number; // after the calibration curve, before stability
  previousRating: number | null;
  stabilizedOverall: number; // after applyStability
  finalDisplayRating: number; // after the *0.99 "out of 99" display scale
  tier: "Bronze" | "Silver" | "Gold" | "Legend";
}

export function traceRating(raw: RawGithubStats, previousRating: number | null): RatingDebugTrace {
  const dimensions = computeDimensions(raw);
  const stage1RawScore = Math.round(weightedRawScore(dimensions) * 100) / 100;
  const measuredOverall = applyCalibrationCurve(stage1RawScore);
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
    stage1RawScore,
    measuredOverall,
    previousRating,
    stabilizedOverall,
    finalDisplayRating,
    tier,
  };
}
