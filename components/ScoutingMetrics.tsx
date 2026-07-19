"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";

export default function ScoutingMetrics({ card }: { card: CricketCardStats }) {
  return (
    <div className="w-full max-w-xs">
      <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5 transition-colors hover:border-bail/30">
        <p className="mb-1 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-bail">
          <span className="h-px w-4 bg-bail" /> Scouting metrics
        </p>
        <p className="mb-4 font-body text-xs text-chalk/50">
          The raw {card.platform === "github" ? "GitHub" : "LeetCode"} numbers behind this card, and exactly which stat each one feeds.
        </p>

        <div className="space-y-4">
          {card.scoutingMetrics.map((m, i) => (
            <div key={m.label}>
              <div className="flex items-baseline justify-between">
                <span className="font-body text-sm text-chalk/80">{m.label}</span>
                <span className="font-mono text-xs text-chalk/50">
                  {m.raw.toLocaleString()} {m.suffix}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-chalk/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.score}%` }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-bail"
                  />
                </div>
                <span className="w-7 shrink-0 text-right font-mono text-xs font-semibold text-bail">{m.score}</span>
              </div>
              <p className="mt-1 font-body text-[11px] leading-snug text-chalk/40">{m.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
