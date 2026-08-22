"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CricketCardStats, Verdict } from "@/lib/cricketStats";

function summarize(card: CricketCardStats): string {
  if (!card.dimensions || card.dimensions.length === 0) return "";
  const sorted = [...card.dimensions].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  return `${strongest.label} is driving the rating. ${weakest.label} is currently the limiting factor.`;
}

const VERDICT_STYLE: Record<Verdict, string> = {
  Strong: "text-bail",
  Solid: "text-bail/80",
  Developing: "text-chalk/60",
  Neutral: "text-chalk/45",
  Limited: "text-chalk/45",
};

export default function DimensionsPanel({ card }: { card: CricketCardStats }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  if (!card.dimensions || card.dimensions.length === 0) return null;

  return (
    <div className="w-full max-w-xs">
      <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5 transition-colors hover:border-bail/30">
        <p className="mb-1 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-bail">
          <span className="h-px w-4 bg-bail" /> Why {card.rating}?
        </p>
        <p className="mb-4 font-body text-xs text-chalk/50">{summarize(card)}</p>

        <div className="space-y-1">
          {card.dimensions.map((d) => {
            const isOpen = openLabel === d.label;
            return (
              <div key={d.label} className="border-b border-chalk/5 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpenLabel(isOpen ? null : d.label)}
                  aria-expanded={isOpen}
                  className="w-full py-2 text-left"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-body text-sm text-chalk/80">
                      {d.label}
                      <span className="ml-1.5 font-mono text-[10px] text-chalk/30">{Math.round(d.weight * 100)}%</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {d.verdict && <span className={`font-display text-[10px] font-bold uppercase tracking-wide ${VERDICT_STYLE[d.verdict]}`}>{d.verdict}</span>}
                      <span className="font-mono text-xs font-semibold text-bail">{d.score}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] text-chalk/30"
                        aria-hidden
                      >
                        ▶
                      </motion.span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-chalk/10">
                    <div className="h-full rounded-full bg-bail" style={{ width: `${d.score}%` }} />
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
                      <div className="pb-3 pl-0.5">
                        {d.evidence && d.evidence.length > 0 ? (
                          <ul className="space-y-1">
                            {d.evidence.map((line, i) => (
                              <li key={i} className="font-body text-[11px] leading-snug text-chalk/50">
                                <span className="mr-1 text-chalk/25" aria-hidden>
                                  —
                                </span>
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-body text-[11px] leading-snug text-chalk/40">{d.note}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
