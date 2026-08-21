"use client";

import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import CountUp from "./CountUp";

const REVEAL_START = 0.55; // let the VS clash land first, then start dealing out rows
const ROW_STAGGER = 0.12;

function StatBar({ av, bv, delay }: { av: number; bv: number; delay: number }) {
  const total = av + bv || 1;
  const aShare = (av / total) * 100;
  const bShare = 100 - aShare;
  const aWins = av > bv;
  const bWins = bv > av;

  return (
    <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-chalk/10">
      <motion.div
        initial={{ width: "50%" }}
        animate={{ width: `${aShare}%` }}
        transition={{ duration: 0.7, delay: delay + 0.1, ease: "easeOut" }}
        className="h-full rounded-l-full"
        style={{ background: aWins ? "#D9A93B" : "rgba(244,241,232,0.25)" }}
      />
      <motion.div
        initial={{ width: "50%" }}
        animate={{ width: `${bShare}%` }}
        transition={{ duration: 0.7, delay: delay + 0.1, ease: "easeOut" }}
        className="h-full rounded-r-full"
        style={{ background: bWins ? "#D9A93B" : "rgba(244,241,232,0.25)" }}
      />
    </div>
  );
}

function StatValue({ value, isWinner, delay }: { value: number; isWinner: boolean; delay: number }) {
  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={isWinner ? { scale: [1, 1.18, 1] } : {}}
      transition={{ duration: 0.5, delay: delay + 0.75 }}
      className={`font-display text-sm font-bold tabular-nums ${isWinner ? "text-bail" : "text-chalk/50"}`}
    >
      <CountUp value={value} duration={0.6} delay={delay + 0.1} />
    </motion.span>
  );
}

export default function CompareStatPanel({ cardA, cardB }: { cardA: CricketCardStats; cardB: CricketCardStats }) {
  const rows = [
    { label: "Overall rating", av: cardA.rating, bv: cardB.rating },
    ...cardA.cardStats.map((s, i) => ({ label: s.label, av: s.value, bv: cardB.cardStats[i].value })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-xl border border-chalk/10 bg-pitch/60 p-5"
    >
      <p className="mb-4 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-leather">
        <span className="h-px w-4 bg-leather" /> Stat for stat
      </p>
      <div className="space-y-4">
        {rows.map((row, i) => {
          const delay = REVEAL_START + i * ROW_STAGGER;
          const tied = row.av === row.bv;
          return (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay }}
              className={i === 0 ? "border-b border-chalk/10 pb-3" : ""}
            >
              <div className="flex items-center justify-between">
                <span className={`font-body text-sm ${i === 0 ? "text-chalk/80" : "text-chalk/70"}`}>{row.label}</span>
                {tied ? (
                  <span className="font-display text-sm font-bold text-chalk/40">tied</span>
                ) : (
                  <span className="flex items-center gap-3">
                    <StatValue value={row.av} isWinner={row.av > row.bv} delay={delay} />
                    <StatValue value={row.bv} isWinner={row.bv > row.av} delay={delay} />
                  </span>
                )}
              </div>
              {!tied && <StatBar av={row.av} bv={row.bv} delay={delay} />}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
