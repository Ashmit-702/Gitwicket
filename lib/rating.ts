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

export interface Dimensions {
  engineeringActivity: number; // commits, long-term weighted — the primary signal
  collaboration: number; // PRs merged into repos you don't own, + reviews given
  consistency: number; // active-weeks ratio over the year — sustained > bursty
  projectDepth: number; // WEAK PROXY: license/description/size. Low weight, on purpose.
  impact: number; // stars/forks/followers — capped, heavily diminishing
  breadth: number; // distinct languages — diminishing hard past ~4-5
  community: number; // issues closed + distinct external repos contributed to
}

export const DIMENSION_WEIGHTS: Record<keyof Dimensions, number> = {
  engineeringActivity: 0.25,
  collaboration: 0.2,
  consistency: 0.15,
  projectDepth: 0.08, // deliberately low — see Dimensions doc comment
  impact: 0.12,
  breadth: 0.1,
  community: 0.1,
};

function sumDailyRange(daily: { date: string; count: number }[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return daily.filter((d) => new Date(d.date).getTime() >= cutoff).reduce((sum, d) => sum + d.count, 0);
}

function activeWeeksRatio(daily: { date: string; count: number }[], windowDays = 365): number {
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
  // Blended, not just weeks — one commit/week alone used to max this at 100% (cheap to
  // game). Days ratio is much harder to cheaply satisfy, so it pulls the number down
  // hard unless activity is genuinely spread across most days, not just most weeks.
  return weeksRatio * 0.4 + daysRatio * 0.6;
}

/** The long-term, absolute-evidence dimension set that feeds Overall. */
export function computeDimensions(raw: RawGithubStats): Dimensions {
  const commits365 = sumDailyRange(raw.dailyContributions, 365);

  const engineeringActivity = saturate(commits365, 300);

  // External collaboration is the strongest signal, but this dimension used to be a
  // hard zero for anyone who hasn't yet contributed to someone else's repo — which is
  // the overwhelming common case for students and solo builders, the exact population
  // using this tool. A capped, secondary credit for shipping your own repos means
  // "hasn't collaborated externally yet" reads as "still building," not "contributes
  // nothing" — while keeping external collaboration worth 3x as much per dimension.
  const externalCollab = saturate(raw.pullRequestsMergedToOthers * 3 + raw.reviews, 40);
  const soloBuilding = saturate(raw.repoCount, 12);
  const collaboration = Math.round(externalCollab * 0.75 + soloBuilding * 0.25);

  const consistency = Math.round(activeWeeksRatio(raw.dailyContributions, 365) * 100);

  // Weak proxies, deliberately capped in how much they can swing this dimension even
  // internally — a repo with a license and a description isn't "deep", it's just tidy.
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
