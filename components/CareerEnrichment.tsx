"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { CricketCardStats } from "@/lib/cricketStats";
import { loadCareerLocal, clearCareerLocal } from "@/lib/careerStorage";
import { buildCareerProfile, type CareerProfile, type EvidenceStatus } from "@/lib/careerProfile";

const STATUS_STYLE: Record<EvidenceStatus, string> = {
  "Strong evidence": "bg-bail/10 text-bail",
  "Moderate evidence": "bg-bail/5 text-bail/70",
  "Limited evidence": "bg-chalk/10 text-chalk/55",
  "No public evidence": "bg-chalk/5 text-chalk/35",
  "Not enough data": "bg-chalk/5 text-chalk/25",
};

function StatusBadge({ status }: { status: EvidenceStatus }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLE[status]}`}>{status}</span>;
}

// Collapsed: label + status only, scannable at a glance. Expanded: the actual
// CV-claim / public-evidence breakdown — this is the fix for Career Proof
// reading as a bare "Skill — Status" wall with no context for *why*.
function CareerProofTable({ items }: { items: CareerProfile["careerProof"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-bail">Career proof</p>
      <p className="mb-3 font-body text-xs text-chalk/40">Claimed vs. publicly observable evidence — not a lie detector, just what&apos;s visible.</p>
      <div className="space-y-1">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={`${item.label}-${i}`} className="border-b border-chalk/5">
              <button type="button" onClick={() => setOpenIndex(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 py-2 text-left">
                <span className="truncate font-body text-sm text-chalk/70">{item.label}</span>
                <StatusBadge status={item.status} />
              </button>
              {isOpen && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pb-3 pl-0.5 font-body text-xs">
                  <dt className="text-chalk/35">{item.claimedOn.includes("CV") ? "CV claim" : "Claimed"}</dt>
                  <dd className="text-chalk/55">{item.claimDetail}</dd>
                  <dt className="text-chalk/35">Public evidence</dt>
                  <dd className="text-chalk/55">{item.evidenceDetail}</dd>
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EnrichedSections({ profile }: { profile: CareerProfile }) {
  const { answers } = profile;
  const hasSnapshot = answers.targetRole || answers.currentStatus || answers.experienceYears || answers.twelveMonthGoal || profile.education.length > 0;
  const skillGroups = profile.skills ? (Object.entries(profile.skills) as [string, string[]][]).filter(([, list]) => list.length > 0) : [];

  return (
    <div className="space-y-12">
      {profile.lowConfidenceExtraction && (
        <p className="rounded-lg border border-dashed border-chalk/15 px-4 py-3 font-body text-xs text-chalk/40">
          Some information couldn&apos;t be extracted from this CV. You can review and complete your profile manually.
        </p>
      )}

      {hasSnapshot && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Career snapshot</p>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {answers.targetRole && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Target role</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{answers.targetRole}</dd>
              </div>
            )}
            {answers.currentStatus && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Status</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{answers.currentStatus}</dd>
              </div>
            )}
            {answers.experienceYears && (
              <div>
                <dt className="font-body text-[11px] uppercase tracking-wide text-chalk/40">Experience</dt>
                <dd className="mt-0.5 font-body text-sm text-chalk/80">{answers.experienceYears}</dd>
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

      {profile.projectMatches.length > 0 && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Project highlights</p>
          <div className="space-y-5">
            {profile.projectMatches.slice(0, 3).map(({ project, githubMatch }) => (
              <div key={project.name} className="border-l-2 border-chalk/10 pl-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="font-display text-sm font-bold text-chalk/80">{project.name}</p>
                  {project.dates && <span className="font-mono text-[10px] text-chalk/30">{project.dates}</span>}
                  {githubMatch && (
                    <a href={githubMatch.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-wide text-bail/70 hover:text-bail">
                      {githubMatch.confidence === "likely" ? "GitHub match" : "Possible GitHub match"} ↗
                    </a>
                  )}
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-wide text-chalk/40 hover:text-bail">
                      Live demo ↗
                    </a>
                  )}
                </div>
                {project.description && <p className="mt-1 font-body text-xs leading-snug text-chalk/50">{project.description}</p>}
                {project.bullets.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {project.bullets.map((b, i) => (
                      <li key={i} className="font-body text-xs leading-snug text-chalk/45">
                        <span className="mr-1 text-chalk/25" aria-hidden>
                          —
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {project.technologies.length > 0 && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-chalk/30">{project.technologies.join(" · ")}</p>}
                {answers.proudestProject === project.name && answers.personalContribution && (
                  <p className="mt-1.5 font-body text-xs italic text-chalk/40">Personal contribution: {answers.personalContribution}</p>
                )}
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
                    {e.isInternship && <span className="ml-2 rounded-full bg-chalk/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-chalk/40">Internship</span>}
                  </p>
                  {e.description && <p className="mt-0.5 font-body text-xs leading-snug text-chalk/40">{e.description}</p>}
                </div>
                {e.dates && <span className="shrink-0 font-mono text-[10px] text-chalk/30">{e.dates}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <CareerProofTable items={profile.careerProof} />

      {profile.improvementActions.length > 0 && (
        <div>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">What to improve</p>
          {/* list-none: this is a numbered list rendered with our own typography, not the
              browser's native <ol> counter — using both at once produced "1. 1." */}
          <ol className="list-none space-y-1.5">
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
  const [confirmingClear, setConfirmingClear] = useState(false);

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
          href="/build-career-card"
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

      {confirmingClear ? (
        <div className="mt-6 rounded-lg border border-leather/30 bg-leather/5 p-3">
          <p className="font-body text-xs text-chalk/60">
            This clears your CV and career answers from this browser only. Your GitHub card and rating are never affected.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                clearCareerLocal(card.login);
                setProfile(null);
                setConfirmingClear(false);
              }}
              className="rounded-full bg-leather px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-chalk"
            >
              Clear it
            </button>
            <button onClick={() => setConfirmingClear(false)} className="rounded-full border border-chalk/20 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-chalk/60">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmingClear(true)} className="mt-6 font-body text-[11px] text-chalk/30 underline decoration-dotted hover:text-chalk/50">
          Clear CV &amp; career answers from this browser
        </button>
      )}
    </div>
  );
}
