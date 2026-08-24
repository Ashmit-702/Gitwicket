"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DimensionBreakdown, Verdict } from "@/lib/cricketStats";

const VERDICT_STYLE: Record<Verdict, string> = {
  Strong: "text-bail",
  Solid: "text-bail/80",
  Developing: "text-chalk/60",
  Neutral: "text-chalk/45",
  Limited: "text-chalk/45",
};

export default function CareerDimensionsGrid({ dimensions }: { dimensions: DimensionBreakdown[] }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  return (
    <div>
      {dimensions.map((d, i) => {
        const isOpen = openLabel === d.label;
        return (
          <motion.div
            key={d.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="border-b border-chalk/10 first:border-t"
          >
            <button type="button" onClick={() => setOpenLabel(isOpen ? null : d.label)} aria-expanded={isOpen} className="w-full py-3 text-left">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-sm font-bold uppercase tracking-wide text-chalk/80">
                  {d.label}
                  <span className="ml-2 font-mono text-[10px] font-normal text-chalk/30">{Math.round(d.weight * 100)}%</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className={`font-display text-[10px] font-bold uppercase tracking-wide ${VERDICT_STYLE[d.verdict]}`}>{d.verdict}</span>
                  <span className="font-mono text-sm font-semibold text-bail">{d.score}</span>
                  <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-[10px] text-chalk/30" aria-hidden>
                    ▶
                  </motion.span>
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-chalk/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.score}%` }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-bail"
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-1 pb-4 pl-0.5">
                    {d.evidence.map((line, j) => (
                      <li key={j} className="font-body text-xs leading-snug text-chalk/50">
                        <span className="mr-1 text-chalk/25" aria-hidden>
                          —
                        </span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
