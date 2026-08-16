"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";

function StarRow({ label, stars, index }: { label: string; stars: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="flex items-center justify-between py-2"
    >
      <span className="font-body text-sm text-chalk/80">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" fill={i < stars ? "#D9A93B" : "none"} stroke="#D9A93B" strokeWidth={1.2}>
            <path d="M10 1.5 12.5 7 18.5 7.7 14 11.8 15.3 18 10 14.8 4.7 18 6 11.8 1.5 7.7 7.5 7Z" />
          </svg>
        ))}
      </div>
    </motion.div>
  );
}

export default function AttributesPanel({ card }: { card: CricketCardStats }) {
  return (
    <div className="w-full max-w-xs space-y-6">
      <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5 transition-colors hover:border-bail/30">
        <p className="mb-1 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-bail">
          <span className="h-px w-4 bg-bail" /> Attributes
        </p>
        <div className="divide-y divide-chalk/10">
          {card.attributes.map((a, i) => (
            <StarRow key={a.label} label={a.label} stars={a.stars} index={i} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5 transition-colors hover:border-bail/30">
        <p className="mb-3 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-bail">
          <span className="h-px w-4 bg-bail" /> Playstyles
        </p>
        <div className="flex flex-wrap gap-2">
          {card.playstyles.map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 18 }}
              className="cursor-default rounded-full border border-bail/40 bg-bail/10 px-3 py-1 font-body text-xs font-medium text-bail transition hover:bg-bail/20"
            >
              {p}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
