"use client";

import { motion } from "framer-motion";
import { LEVEL_MARGIN } from "@/components/compare/CompareDimensions";

// A gap smaller than LEVEL_MARGIN is reported as level, not as a win — the
// underlying ratings are untouched; only the wording changes.
export default function CompareWinnerBanner({ name, winnerRating, loserRating }: { name: string; winnerRating: number; loserRating: number }) {
  const gap = winnerRating - loserRating;
  return (
    <motion.p
      className="mt-2 font-body text-sm text-chalk/60"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
    >
      {gap < LEVEL_MARGIN ? (
        <>Too close to call — {winnerRating} RTG to {loserRating}.</>
      ) : (
        <><span className="font-semibold text-bail">{name}</span> leads by {gap}, {winnerRating} RTG to {loserRating}.</>
      )}
    </motion.p>
  );
}
