"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";

// Below this gap a dimension (or the overall rating) is shown as level rather
// than "won" — a 2-point difference is inside the noise of public-GitHub data.
export const LEVEL_MARGIN = 4;

function Bar({ value, tone, from, delay }: { value: number; tone: "lead" | "trail" | "level"; from: "left" | "right"; delay: number }) {
  const fill = tone === "lead" ? "bg-[#E2852B]" : tone === "level" ? "bg-bail/70" : "bg-chalk/30";
  return (
    <div className={`flex h-2 w-full bg-chalk/[0.06] ${from === "right" ? "justify-end" : "justify-start"}`}>
      <motion.div
        className={`h-full ${fill}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export default function CompareDimensions({ a, b }: { a: CricketCardStats; b: CricketCardStats }) {
  const rows = (a.dimensions ?? []).flatMap((da) => {
    const db = b.dimensions?.find((d) => d.label === da.label);
    return db ? [{ label: da.label, a: da.score, b: db.score }] : [];
  });
  if (rows.length === 0) return null;

  const tone = (mine: number, theirs: number) => (Math.abs(mine - theirs) < LEVEL_MARGIN ? "level" : mine > theirs ? "lead" : "trail");
  const edgeA = rows.filter((r) => r.a - r.b >= LEVEL_MARGIN).sort((x, y) => y.a - y.b - (x.a - x.b)).slice(0, 2);
  const edgeB = rows.filter((r) => r.b - r.a >= LEVEL_MARGIN).sort((x, y) => y.b - y.a - (x.b - x.a)).slice(0, 2);
  const level = rows.filter((r) => Math.abs(r.a - r.b) < LEVEL_MARGIN).length;

  return (
    <section aria-labelledby="dims-h" className="mx-auto mt-14 max-w-4xl">
      <h2 id="dims-h" className="font-display text-xs font-bold uppercase tracking-[0.25em] text-[#E2852B]">Dimension by dimension</h2>

      <div className="mt-2 grid grid-cols-2 font-display text-sm font-black uppercase italic text-chalk">
        <span>@{a.login}</span>
        <span className="text-right">@{b.login}</span>
      </div>

      <ul className="mt-4 divide-y divide-chalk/10 border-y border-chalk/10">
        {rows.map((r, i) => (
          <li key={r.label} className="py-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
              <span className={`font-mono text-sm tabular-nums ${r.a >= r.b + LEVEL_MARGIN ? "text-[#E2852B]" : "text-chalk/60"}`}>{r.a}</span>
              <span className="text-center font-display text-[11px] uppercase tracking-widest text-chalk/50 sm:text-xs">{r.label}</span>
              <span className={`text-right font-mono text-sm tabular-nums ${r.b >= r.a + LEVEL_MARGIN ? "text-[#E2852B]" : "text-chalk/60"}`}>{r.b}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1" aria-hidden>
              <Bar value={r.a} tone={tone(r.a, r.b)} from="right" delay={0.05 * i} />
              <Bar value={r.b} tone={tone(r.b, r.a)} from="left" delay={0.05 * i} />
            </div>
          </li>
        ))}
      </ul>

      <motion.div
        className="mt-8 grid gap-6 sm:grid-cols-2"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {[{ who: a, edge: edgeA }, { who: b, edge: edgeB }].map(({ who, edge }) => (
          <div key={who.login}>
            <p className="font-display text-xs font-bold uppercase tracking-widest text-chalk/45">Where @{who.login} leads</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-chalk/70">
              {edge.length ? edge.map((e) => `${e.label} (+${Math.abs(e.a - e.b)})`).join(" · ") : "No clear edge on any dimension."}
            </p>
          </div>
        ))}
      </motion.div>
      {level > 0 && <p className="mt-4 font-body text-xs text-chalk/40">{level} of {rows.length} dimensions are within {LEVEL_MARGIN - 1} points — effectively level.</p>}
    </section>
  );
}
