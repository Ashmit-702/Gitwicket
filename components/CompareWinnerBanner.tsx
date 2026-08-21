"use client";

import { motion } from "framer-motion";

export default function CompareWinnerBanner({ name, winnerRating, loserRating }: { name: string; winnerRating: number; loserRating: number }) {
  return (
    <motion.p
      className="mt-2 font-body text-sm text-chalk/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.9, duration: 0.5 }}
    >
      <span className="font-semibold text-bail">{name}</span> takes it, {winnerRating} RTG to {loserRating}.
    </motion.p>
  );
}
