"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import CountUp from "./CountUp";

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
          <p className="mt-1 font-display text-6xl font-black italic text-chalk">
            <CountUp value={card.rating} duration={0.9} />
          </p>
          <p className="mt-1 font-body text-xs text-chalk/50">{card.tier} tier · {card.role}</p>
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
