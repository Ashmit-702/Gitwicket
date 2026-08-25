"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import { loadCareerLocal, clearCareerLocal } from "@/lib/careerStorage";
import { buildCareerProfile, type CareerProfile } from "@/lib/careerProfile";

function EvidenceBadge({ evidence }: { evidence: "Strong" | "Moderate" | "Not tracked" }) {
  const style = evidence === "Strong" ? "bg-bail/10 text-bail" : evidence === "Moderate" ? "bg-chalk/10 text-chalk/60" : "bg-chalk/5 text-chalk/30";
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${style}`}>{evidence}</span>;
}

function EnrichedSections({ profile }: { profile: CareerProfile }) {
  const { answers } = profile;
  const hasSnapshot = answers.developerType || answers.targetRole || answers.experienceLevel || answers.twelveMonthGoal || profile.education.length > 0;
  const skillGroups = profile.skills
    ? (Object.entries(profile.skills) as [string, string[]][]).filter(([, list]) => list.length > 0)
    : [];

  return (
    <div className="space-y-12">
      {hasSnapshot && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Career snapshot</p>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {answers.experienceLevel && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Experience</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{answers.experienceLevel} yrs</dd>
              </div>
            )}
            {answers.developerType && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Primary focus</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{answers.developerType}</dd>
              </div>
            )}
            {profile.education[0] && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Education</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{profile.education[0].institution}</dd>
              </div>
            )}
            {answers.twelveMonthGoal && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Current goal</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{answers.twelveMonthGoal}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {skillGroups.length > 0 && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Technical profile</p>
          <div className="space-y-2">
            {skillGroups.map(([category, list]) => (
              <div key={category} className="flex flex-wrap items-baseline gap-2">
                <span className="w-20 shrink-0 font-body text-[11px] uppercase tracking-wide text-chalk/40">{category}</span>
                <span className="font-body text-sm text-chalk/70">{list.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.projects.length > 0 && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Project highlights</p>
          <div className="space-y-4">
            {profile.projects.slice(0, 3).map((p) => (
              <div key={p.name} className="border-l-2 border-chalk/10 pl-4">
                <p className="font-display text-sm font-bold text-chalk/80">{p.name}</p>
                {p.description && <p className="mt-0.5 font-body text-xs leading-snug text-chalk/50">{p.description}</p>}
                {p.technologies.length > 0 && <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-chalk/30">{p.technologies.join(" · ")}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.experience.length > 0 && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Experience</p>
          <div className="space-y-3">
            {profile.experience.map((e, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 border-b border-chalk/5 pb-3">
                <div>
                  <p className="font-body text-sm text-chalk/80">
                    {e.role || "Role"} {e.company && <span className="text-chalk/50">· {e.company}</span>}
                  </p>
                  {e.description && <p className="mt-0.5 font-body text-xs leading-snug text-chalk/40">{e.description}</p>}
                </div>
                {e.dates && <span className="shrink-0 font-mono text-[10px] text-chalk/30">{e.dates}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.careerProof.length > 0 && (
        <div>
          <p className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-bail">Career proof</p>
          <p className="mb-3 font-body text-xs text-chalk/40">Claimed vs. publicly observable evidence.</p>
          <div className="space-y-1.5">
            {profile.careerProof.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 border-b border-chalk/5 py-1.5">
                <span className="font-body text-sm text-chalk/70">{item.label}</span>
                <EvidenceBadge evidence={item.evidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.improvementActions.length > 0 && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">What to improve</p>
          <ol className="space-y-1.5">
            {profile.improvementActions.map((a, i) => (
              <li key={i} className="font-body text-sm text-chalk/60">
                <span className="mr-2 font-mono text-xs text-chalk/30">{i + 1}.</span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function CareerEnrichment({ card }: { card: CricketCardStats }) {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const local = loadCareerLocal(card.login);
    if (local) {
      setProfile(buildCareerProfile(card, local.parsedCv, local.answers));
    }
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.login]);

  if (!checked) return null;

  if (!profile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dashed border-chalk/15 p-6 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-chalk/70">Build your Career Card</p>
        <p className="mx-auto mt-2 max-w-sm font-body text-sm text-chalk/50">
          Add your CV and a few quick answers to turn this into a complete, evidence-backed career profile.
        </p>
        <a
          href={`/build-career-card`}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-bail px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-pitch transition hover:opacity-90"
        >
          Build Career Card →
        </a>
      </motion.div>
    );
  }

  return (
    <div>
      <EnrichedSections profile={profile} />
      <button
        onClick={() => {
          clearCareerLocal(card.login);
          setProfile(null);
        }}
        className="mt-6 font-body text-[11px] text-chalk/30 underline decoration-dotted hover:text-chalk/50"
      >
        Clear CV and answers from this browser
      </button>
    </div>
  );
}
