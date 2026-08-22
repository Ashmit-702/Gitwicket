import type { RawGithubStats } from "./github";
import type { Dimensions } from "./rating";

// ============================================================================
// EVIDENCE ENGINE (v1, GitHub-only)
// ============================================================================
// Part of the "Career Analysis" layer discussed in the product roadmap — kept
// architecturally separate from "Rating Analysis" on purpose:
//
//   Sources (RawGithubStats)
//     ├── Rating Analysis  (lib/rating.ts)   — computeDimensions, weights, the
//     │                                        calibration curve, stability.
//     │                                        FROZEN. Nothing in this file
//     │                                        reads evidence.ts, and nothing
//     │                                        in evidence.ts writes back into it.
//     └── Career Analysis  (this file, +CV/etc. later) — explains and enriches,
//                                                          never scores.
//
// This file takes the SAME RawGithubStats + the dimension scores that
// lib/rating.ts already computed, and derives plain-English evidence bullets
// from them — no new API calls, no new scoring logic, no ability to move the
// rating. It exists purely to answer "why is my Collaboration a 46" with real
// numbers instead of a one-line static note.
//
// The most important behavior here: for the two NEUTRAL-BASELINE dimensions
// (Collaboration, Community — see lib/rating.ts's saturateFromFloor), a score
// near the floor with zero raw signal is explicitly labeled "Neutral — no
// evidence yet," never "Weak" or "Limited." That distinction — absence of
// evidence vs. evidence of weakness — was the whole point of the last rating
// recalibration; the UI needs to say it out loud, not just encode it in a
// curve nobody can see.

export type Verdict = "Strong" | "Solid" | "Developing" | "Neutral" | "Limited";

export interface DimensionEvidence {
  verdict: Verdict;
  bullets: string[];
}

function verdictFor(score: number): Verdict {
  if (score >= 70) return "Strong";
  if (score >= 55) return "Solid";
  if (score >= 40) return "Developing";
  return "Limited";
}

/** Verdict for a neutral-baseline dimension: only "Neutral" when there's genuinely no raw signal. */
function neutralAwareVerdict(score: number, rawSignal: number, floor: number): Verdict {
  if (rawSignal === 0 && score <= floor + 2) return "Neutral";
  return verdictFor(score);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function computeEvidence(raw: RawGithubStats, dims: Dimensions): Record<keyof Dimensions, DimensionEvidence> {
  const externalCollabSignal = raw.pullRequestsMergedToOthers * 3 + raw.reviews;
  const communitySignal = raw.issuesClosed + raw.pullRequestsMergedToOthers * 2;

  return {
    engineeringActivity: {
      verdict: verdictFor(dims.engineeringActivity),
      bullets: [
        `${plural(raw.commits, "commit")} in the last year.`,
        raw.commits >= 250
          ? "Well past the point of diminishing returns — this is a strong, sustained signal on its own."
          : raw.commits > 0
            ? "More commits keep helping meaningfully up to a few hundred a year, then taper off."
            : "No commit activity found in the trailing year.",
      ],
    },
    projectStrength: {
      verdict: verdictFor(dims.projectStrength),
      bullets: [
        `${plural(raw.repoCount, "owned, non-fork repo")}.`,
        `${plural(raw.reposWithDescription, "repo")} with a description, ${plural(raw.reposWithLicense, "repo")} with a license.`,
        raw.avgRepoSizeKb > 0
          ? `Average repo size ${Math.round(raw.avgRepoSizeKb).toLocaleString()} KB — a rough signal these aren't empty placeholders.`
          : "Repos look mostly empty or brand new.",
      ],
    },
    consistency: {
      verdict: verdictFor(dims.consistency),
      bullets: [
        `Active in ${activeWeeksLabel(raw.dailyContributions)} of the last year.`,
        "Scored from a blend of full-year spread and your single best ~3-month stretch — one quiet season doesn't erase a strong one.",
      ],
    },
    collaboration: {
      verdict: neutralAwareVerdict(dims.collaboration, externalCollabSignal, 46),
      bullets:
        externalCollabSignal === 0
          ? [
              "No merged PRs into repos you don't own, and no reviews given yet.",
              "This is scored as neutral, not weak — most solo builders and students simply haven't had the chance to collaborate externally yet.",
            ]
          : [
              `${plural(raw.pullRequestsMergedToOthers, "PR")} merged into repos you don't own.`,
              `${plural(raw.reviews, "review")} given in the last year.`,
            ],
    },
    impact: {
      verdict: verdictFor(dims.impact),
      bullets: [
        `${plural(raw.stars, "star")}, ${plural(raw.forks, "fork")}, ${plural(raw.followers, "follower")}.`,
        "Heavily capped on purpose — popularity alone can't dominate this score.",
      ],
    },
    breadth: {
      verdict: verdictFor(dims.breadth),
      bullets: [
        `${plural(raw.languageCount, "language")} used across your repos${raw.topLanguage ? `, most often ${raw.topLanguage}` : ""}.`,
        "The jump from 1 to 3 languages matters far more than 6 to 9.",
      ],
    },
    community: {
      verdict: neutralAwareVerdict(dims.community, communitySignal, 38),
      bullets:
        communitySignal === 0
          ? [
              "No closed issues or external contributions on record yet.",
              "Scored as neutral, not weak — this is optional, discretionary evidence most profiles simply don't have yet.",
            ]
          : [`${plural(raw.issuesClosed, "issue")} closed.`, `${plural(raw.pullRequestsMergedToOthers, "external PR")} counted toward community credit.`],
    },
  };
}

function activeWeeksLabel(daily: { date: string; count: number }[]): string {
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const activeWeeks = new Set<string>();
  const totalWeeks = new Set<string>();
  for (const d of daily) {
    const time = new Date(d.date).getTime();
    if (time < cutoff) continue;
    const weekKey = Math.floor(time / (7 * 24 * 60 * 60 * 1000));
    totalWeeks.add(String(weekKey));
    if (d.count > 0) activeWeeks.add(String(weekKey));
  }
  return `${activeWeeks.size} of ${Math.min(52, totalWeeks.size || 52)} weeks`;
}
