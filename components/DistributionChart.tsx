"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";

// A fixed, deterministic bell-shaped histogram standing in for "all rated cricket cards" —
// calibrated separately per platform since GitHub and LeetCode ratings have different
// natural spreads (LeetCode's is wider: a lot of casual solvers pull the mean down, with a
// long climb to the Hard-problem-heavy Legend tier).
//
// GitHub's mean is set BELOW the "competent" band (45-59), not centered on it: most public
// GitHub accounts are dormant, abandoned, or genuinely early — a single course project, a
// forked starter repo, an account touched twice in 2019. A real, actively-maintained profile
// clears that bar quickly. (Previously this was mean=52 — which happened to be exactly the
// v6 calibration curve's midpoint control point, so any "competent" 52-rated card landed at
// *precisely* the 50th percentile by coincidence, no matter how solid the underlying evidence
// was. That made a genuinely decent score read as "perfectly average," which undersold it.)
const BUCKETS = 20; // 0-99 split into 20 buckets of ~5 points each
const DIST_BY_PLATFORM = {
  github: { mean: 40, std: 18 },
  leetcode: { mean: 50, std: 12 },
};
const ACCENT_BY_PLATFORM = {
  github: { bar: "rgba(217,169,59,0.85)", text: "text-bail", line: "border-bail/60" },
  leetcode: { bar: "rgba(226,133,43,0.85)", text: "text-[#E2852B]", line: "border-[#E2852B]/60" },
};

function bucketHeight(index: number, mean: number, std: number) {
  const x = index * (99 / BUCKETS) + 99 / BUCKETS / 2;
  const z = (x - mean) / std;
  return Math.exp(-0.5 * z * z);
}

// rough normal CDF (Zelen & Severo approximation) — good enough for a percentile label, not a stats paper
function normalCdf(x: number, mean: number, std: number) {
  const z = (x - mean) / (std * Math.SQRT2);
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  const erf = z >= 0 ? y : -y;
  return 0.5 * (1 + erf);
}

export default function DistributionChart({ card }: { card: CricketCardStats }) {
  const { mean, std } = DIST_BY_PLATFORM[card.platform];
  const accent = ACCENT_BY_PLATFORM[card.platform];
  const heights = Array.from({ length: BUCKETS }, (_, i) => bucketHeight(i, mean, std));
  const maxHeight = Math.max(...heights);
  // no artificial floor here — a genuinely low rating should show a genuinely low percentile,
  // not read like a badge. Clamped only to keep 1-99 sane at the extreme tails.
  const percentile = Math.min(99, Math.max(1, Math.round(normalCdf(card.rating, mean, std) * 100)));
  const markerPct = Math.min(97, Math.max(2, (card.rating / 99) * 100));
  const isAboveAverage = percentile >= 50;

  return (
    <div className="w-full max-w-xs">
      <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5">
        <p className={`mb-1 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
          <span className={`h-px w-4 ${accent.text.replace("text-", "bg-")}`} /> Distribution
        </p>
        <p className="mb-4 font-body text-xs text-chalk/50">
          Where {card.rating} RTG sits against every {card.platform === "github" ? "GitHub" : "LeetCode"} card GitWicket has rated.
        </p>

        <div className="relative h-24">
          <div className="flex h-full items-end gap-[3px]">
            {heights.map((h, i) => {
              const bucketStart = i * (99 / BUCKETS);
              const isPast = bucketStart <= card.rating;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (h / maxHeight) * 100)}%` }}
                  transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
                  className="flex-1 rounded-t-sm"
                  style={{ background: isPast ? accent.bar : "rgba(244,241,232,0.15)" }}
                />
              );
            })}
          </div>

          {/* dashed marker + label pinned at this card's position */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="pointer-events-none absolute -top-6 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${markerPct}%` }}
          >
            <span className={`whitespace-nowrap font-mono text-[10px] font-semibold ${accent.text}`}>
              {card.login} · {card.rating}
            </span>
            <span className={`mt-0.5 h-[88px] w-px border-l border-dashed ${accent.line}`} />
          </motion.div>
        </div>

        <p className="mt-4 font-body text-xs text-chalk/60">
          {isAboveAverage ? (
            <>
              Higher than <span className={`font-semibold ${accent.text}`}>{percentile}%</span> of cards on GitWicket.
            </>
          ) : (
            <>
              Ahead of only <span className={`font-semibold ${accent.text}`}>{percentile}%</span> of cards so far — plenty of runway to climb.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
