"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import { careerSummary } from "@/lib/cricketStats";
import { buildCareerProfile, EMPTY_ANSWERS, type CareerProfile } from "@/lib/careerProfile";
import { loadCareerLocal } from "@/lib/careerStorage";
import CountUp from "@/components/CountUp";
import ShareMenu from "@/components/shared/ShareMenu";

const LBL = "font-display text-[10px] font-bold uppercase tracking-[0.2em] text-chalk/45";

// Display-only: shows the existing rating and form as-is. Career data (CV,
// answers) only ever feeds the strengths/needs/next-step lines below them.
export default function ScoutingHeader({ card }: { card: CricketCardStats }) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  useEffect(() => {
    const local = loadCareerLocal(card.login);
    setProfile(buildCareerProfile(card, local?.parsedCv ?? null, local?.answers ?? EMPTY_ANSWERS));
  }, [card]);

  const { strengths, developing } = useMemo(() => careerSummary(card.dimensions ?? []), [card]);
  const role = profile?.answers.targetRole ?? null;
  const status = profile?.answers.currentStatus ?? null;
  const strongest = (profile?.roleAlignment?.strong.length ? profile.roleAlignment.strong : strengths.map((s) => s.label)).slice(0, 3);
  const needs = (profile?.roleAlignment?.needsEvidence.length ? profile.roleAlignment.needsEvidence : developing.map((d) => d.label)).slice(0, 3);
  const next = profile?.improvementActions?.[0];

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} aria-label="Scouting report" className="border border-[#E2852B]/30 bg-[#0B1018]/80">
      <div className="flex flex-col gap-6 p-5 sm:p-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#E2852B]">Career scouting report</p>
          <h1 className="mt-2 break-words font-display text-4xl font-black uppercase italic leading-[0.95] text-chalk sm:text-6xl">{card.name}</h1>
          <p className="mt-2 font-body text-sm text-chalk/60">@{card.login}{role ? <> · <span className="text-[#E2852B]">{role}</span></> : null}{status ? ` · ${status}` : ""}</p>
          {!role && <Link href="/build-career-card" className="mt-3 inline-block font-display text-xs uppercase tracking-widest text-[#E2852B] underline-offset-4 hover:underline">Set a target role for role-specific evidence →</Link>}
        </div>
        <div className="flex gap-8">
          <div><p className={LBL}>OVR</p><p className="font-display text-6xl font-black italic leading-none text-chalk sm:text-7xl"><CountUp value={card.rating} duration={1.1} /></p></div>
          {typeof card.form === "number" && <div><p className={LBL}>Form</p><p className="font-display text-6xl font-black italic leading-none text-[#E2852B] sm:text-7xl"><CountUp value={card.form} duration={1.1} delay={0.15} /></p></div>}
        </div>
      </div>

      <div className="grid gap-px border-t border-chalk/10 bg-chalk/10 sm:grid-cols-2">
        {[{ t: "Strongest", items: strongest, tone: "text-chalk" }, { t: role ? `Needs evidence for ${role}` : "Needs evidence", items: needs, tone: "text-chalk/80" }].map((col, i) => (
          <motion.div key={col.t} className="bg-[#0B1018] p-5 sm:px-8" initial={{ opacity: 0, x: i ? 12 : -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}>
            <p className={LBL}>{col.t}</p>
            <ul className="mt-3 space-y-1.5">
              {col.items.length ? col.items.map((s) => (<li key={s} className={`flex items-center gap-2 font-body text-sm ${col.tone}`}><span aria-hidden className={`h-1.5 w-1.5 ${i ? "bg-chalk/30" : "bg-[#E2852B]"}`} />{s}</li>)) : <li className="font-body text-sm text-chalk/40">Nothing flagged yet.</li>}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-chalk/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-xl font-body text-sm leading-relaxed text-chalk/70">{next ? <><span className="mr-2 font-display text-[10px] font-bold uppercase tracking-widest text-[#E2852B]">Next</span>{next}</> : "Add your CV and answer a few questions below to unlock Career Proof, role alignment and personalised next steps."}</p>
        <div className="flex shrink-0 items-center gap-3">
          <Link href={`/${card.login}`} className="font-display text-xs uppercase tracking-widest text-chalk/55 transition hover:text-[#E2852B]">Cricket card</Link>
          <ShareMenu path={`/${card.login}/career`} text={`${card.name}'s developer career, scouted on GitWicket`} />
        </div>
      </div>
    </motion.section>
  );
}
