"use client";

import { motion } from "framer-motion";
import type { DimensionBreakdown } from "@/lib/cricketStats";

function Chip({ d, tone, index }: { d: DimensionBreakdown; tone: "strong" | "developing"; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.4 }}
      className={`rounded-lg border px-3 py-2 ${tone === "strong" ? "border-bail/30 bg-bail/5" : "border-chalk/10 bg-chalk/5"}`}
    >
      <p className={`font-display text-xs font-bold uppercase tracking-wide ${tone === "strong" ? "text-bail" : "text-chalk/60"}`}>{d.label}</p>
      <p className="mt-0.5 font-mono text-[11px] text-chalk/40">{d.score}/100</p>
    </motion.div>
  );
}

export default function CareerStrengths({ strengths, developing }: { strengths: DimensionBreakdown[]; developing: DimensionBreakdown[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-widest text-bail">Strengths</p>
        <div className="flex flex-col gap-2">
          {strengths.map((d, i) => (
            <Chip key={d.label} d={d} tone="strong" index={i} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-widest text-chalk/40">Gaps</p>
        {developing.length > 0 ? (
          <div className="flex flex-col gap-2">
            {developing.map((d, i) => (
              <Chip key={d.label} d={d} tone="developing" index={i + 2} />
            ))}
          </div>
        ) : (
          <p className="font-body text-xs text-chalk/40">No clear gaps — every dimension is either solid or genuinely neutral (no optional evidence yet, not a weakness).</p>
        )}
      </div>
    </div>
  );
}
