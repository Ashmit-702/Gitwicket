"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import CountUp from "@/components/CountUp";
import ShareMenu from "@/components/shared/ShareMenu";
import { LEVEL_MARGIN } from "@/components/compare/CompareDimensions";

const ease = [0.22, 1, 0.36, 1] as const;

function Player({ c, side, lead }: { c: CricketCardStats; side: "l" | "r"; lead: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, x: side === "l" ? -48 : 48, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.7, ease }}
      className={`flex min-w-0 flex-col items-center text-center ${side === "l" ? "md:items-start md:text-left" : "md:items-end md:text-right"}`}>
      <Image src={c.avatarUrl} alt="" width={72} height={72} className={`h-16 w-16 border-2 object-cover sm:h-[72px] sm:w-[72px] ${lead ? "border-[#E2852B]" : "border-chalk/20"}`} unoptimized />
      <p className="mt-3 max-w-full truncate font-display text-2xl font-black uppercase italic text-chalk sm:text-3xl">{c.name}</p>
      <p className="font-body text-xs text-chalk/50">@{c.login} · {c.tier} · {c.role}</p>
      <p className={`mt-3 font-display text-7xl font-black italic leading-none sm:text-8xl ${lead ? "text-[#E2852B]" : "text-chalk"}`}><CountUp value={c.rating} duration={1.2} delay={0.4} /></p>
      <p className="mt-1 font-display text-[10px] uppercase tracking-[0.25em] text-chalk/45">Overall</p>
      {typeof c.form === "number" && <p className="mt-3 font-display text-xs uppercase tracking-widest text-chalk/60">Form <span className="ml-1 text-lg font-black text-chalk"><CountUp value={c.form} duration={1} delay={0.7} /></span></p>}
    </motion.div>
  );
}

function StatRow({ label, a, b, i }: { label: string; a: number; b: number; i: number }) {
  const lvl = Math.abs(a - b) < LEVEL_MARGIN;
  const bar = (v: number, mine: boolean, from: "left" | "right") => (
    <div className={`flex h-2 bg-chalk/[0.07] ${from === "right" ? "justify-end" : ""}`}>
      <motion.div className={`h-full ${lvl ? "bg-bail/70" : mine ? "bg-[#E2852B]" : "bg-chalk/30"}`} initial={{ width: 0 }} animate={{ width: `${Math.max(2, v)}%` }} transition={{ duration: 0.7, delay: 0.9 + i * 0.07, ease }} />
    </div>
  );
  return (
    <li className="py-3.5">
      <div className="grid grid-cols-[3rem_1fr_3rem] items-center gap-3 sm:grid-cols-[4rem_1fr_4rem]">
        <span className={`font-mono text-sm tabular-nums ${!lvl && a > b ? "font-bold text-[#E2852B]" : "text-chalk/65"}`}>{a}</span>
        <span className="text-center font-display text-[11px] uppercase tracking-widest text-chalk/55 sm:text-xs">{label}</span>
        <span className={`text-right font-mono text-sm tabular-nums ${!lvl && b > a ? "font-bold text-[#E2852B]" : "text-chalk/65"}`}>{b}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1" aria-hidden>{bar(a, a > b, "right")}{bar(b, b > a, "left")}</div>
    </li>
  );
}

export default function HeadToHead({ a, b }: { a: CricketCardStats; b: CricketCardStats }) {
  const gap = Math.abs(a.rating - b.rating);
  const leader = gap < LEVEL_MARGIN ? null : a.rating > b.rating ? a : b;
  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid items-start gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-10">
        <Player c={a} side="l" lead={leader === a} />
        <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.5, ease }} className="flex items-center justify-center gap-4 md:mt-24 md:flex-col">
          <span className="h-px w-12 bg-chalk/15 md:h-12 md:w-px" /><span className="font-display text-2xl font-black italic text-[#E2852B]">VS</span><span className="h-px w-12 bg-chalk/15 md:h-12 md:w-px" />
        </motion.div>
        <Player c={b} side="r" lead={leader === b} />
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-6 text-center font-body text-sm text-chalk/65">
        {leader ? <><span className="font-semibold text-[#E2852B]">{leader.name}</span> leads by {gap} overall.</> : <>Too close to call — {gap === 0 ? "level" : `${gap} point${gap > 1 ? "s" : ""} apart`}.</>}
      </motion.p>

      <section aria-labelledby="stats-h" className="mt-12">
        <h2 id="stats-h" className="font-display text-xs font-bold uppercase tracking-[0.25em] text-[#E2852B]">Cricket stats</h2>
        <ul className="mt-2 divide-y divide-chalk/10 border-y border-chalk/10">
          {a.cardStats.map((s, i) => { const o = b.cardStats.find((x) => x.abbr === s.abbr); return o ? <StatRow key={s.abbr} label={s.label} a={s.value} b={o.value} i={i} /> : null; })}
        </ul>
      </section>

      <div className="mt-8 flex justify-center"><ShareMenu path={`/compare/${a.login}/${b.login}`} text={`@${a.login} vs @${b.login} on GitWicket`} label="Share comparison" /></div>
    </div>
  );
}
