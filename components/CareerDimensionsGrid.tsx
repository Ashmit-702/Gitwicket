"use client";

import { motion } from "framer-motion";
import type { DimensionBreakdown, Verdict } from "@/lib/cricketStats";

const VERDICT_STYLE: Record<Verdict, string> = {
  Strong: "text-bail",
  Solid: "text-bail/80",
  Developing: "text-chalk/60",
  Neutral: "text-chalk/45",
  Limited: "text-chalk/45",
};

export default function CareerDimensionsGrid({ dimensions }: { dimensions: DimensionBreakdown[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {dimensions.map((d, i) => (
        <motion.div
          key={d.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="rounded-xl border border-chalk/10 bg-pitch/60 p-5"
        >
          <div className="flex items-baseline justify-between">
            <span className="font-display text-sm font-bold uppercase tracking-wide text-chalk/80">{d.label}</span>
            <span className="flex items-center gap-2">
              <span className={`font-display text-[10px] font-bold uppercase tracking-wide ${VERDICT_STYLE[d.verdict]}`}>{d.verdict}</span>
              <span className="font-mono text-sm font-semibold text-bail">{d.score}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-chalk/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${d.score}%` }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-bail"
            />
          </div>
          <ul className="mt-3 space-y-1">
            {d.evidence.map((line, j) => (
              <li key={j} className="font-body text-xs leading-snug text-chalk/50">
                <span className="mr-1 text-chalk/25" aria-hidden>
                  —
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-chalk/25">{Math.round(d.weight * 100)}% of career rating</p>
        </motion.div>
      ))}
    </div>
  );
}
