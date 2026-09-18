"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import CountUp from "./CountUp";

const TIER_GLOW: Record<string, string> = {
  Legend: "0 0 32px -4px rgba(217,169,59,0.55)",
  Gold: "0 0 24px -6px rgba(217,169,59,0.4)",
  Silver: "0 0 16px -8px rgba(244,241,232,0.25)",
  Bronze: "none",
};

export default function CareerSnapshot({ card }: { card: CricketCardStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-chalk/10 bg-pitch/60 p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-leather">Career rating</p>
          <p
            className="mt-1 font-display text-7xl font-black italic text-bail"
            style={{ textShadow: TIER_GLOW[card.tier] || "none" }}
          >
            <CountUp value={card.rating} duration={0.9} />
          </p>
          <p className="mt-1 font-body text-xs text-chalk/50">{card.tier} tier · {card.role}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-chalk/30">
            Verified from {card.platform === "github" ? "GitHub" : "LeetCode"}
          </p>
        </div>

        {typeof card.form === "number" && (
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-leather">Current form</p>
            <p className="mt-1 font-display text-3xl font-bold text-chalk">
              <CountUp value={card.form} duration={0.9} delay={0.1} />
            </p>
            <p className="mt-1 font-body text-xs text-chalk/50">
              {card.formTrend === "up" ? "↑ hotter than career average" : card.formTrend === "down" ? "↓ quieter than career average" : "→ matching career average"}
            </p>
          </div>
        )}

        <div className="ml-auto text-right">
          <p className="font-display text-xs uppercase tracking-widest text-leather">Tenure</p>
          <p className="mt-1 font-body text-sm text-chalk/70">{card.activeYears} active {card.activeYears === 1 ? "year" : "years"}</p>
          <p className="font-body text-xs text-chalk/40">{card.accountAgeYears}yr on {card.platform === "github" ? "GitHub" : "LeetCode"}</p>
        </div>
      </div>
    </motion.div>
  );
}
