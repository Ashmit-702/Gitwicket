import type { CricketCardStats, DimensionBreakdown } from "./cricketStats";
import type { ParsedCv } from "./cvParsing";

// ============================================================================
// CAREER ANALYSIS — the layer this file lives in, per the architecture rule:
//
//   Rating Analysis (lib/rating.ts):      GitHub/LeetCode -> rating.   FROZEN.
//   Career Analysis (this file):          GitHub + CV + Answers -> profile.
//
// Nothing here can move the rating — it only ever READS a CricketCardStats
// that was already fully computed by the frozen pipeline. This file adds a
// presentation/analysis layer on top, nothing more.
// ============================================================================

export interface CareerAnswers {
  developerType: string | null; // Frontend / Backend / Full Stack / AI-ML / Data / DevOps / Mobile / Security / Systems / Other
  targetRole: string | null; // free text
  experienceLevel: string | null; // Student / 0-1 / 1-2 / 2-4 / 4-7 / 7+
  lookingFor: string | null; // Internship / Full-time / Freelance / Not looking
  proudestProject: string | null;
  personalContribution: string | null; // "what did YOU personally build" — separate from CV project descriptions on purpose
  twelveMonthGoal: string | null;
}

export const EMPTY_ANSWERS: CareerAnswers = {
  developerType: null,
  targetRole: null,
  experienceLevel: null,
  lookingFor: null,
  proudestProject: null,
  personalContribution: null,
  twelveMonthGoal: null,
};

export type EvidenceStrength = "Strong" | "Moderate" | "Not tracked";

export interface CareerProofItem {
  label: string;
  claimedOn: ("CV" | "Answers")[];
  evidence: EvidenceStrength;
  note: string;
}

export interface CareerProfile {
  hasCv: boolean;
  hasAnswers: boolean;
  person: { name: string | null; links: ParsedCv["person"]["links"] } | null; // only non-private fields surface here
  education: ParsedCv["education"];
  experience: ParsedCv["experience"];
  projects: ParsedCv["projects"];
  skills: ParsedCv["skills"] | null;
  certifications: ParsedCv["certifications"];
  answers: CareerAnswers;
  careerProof: CareerProofItem[];
  improvementActions: string[];
}

const IMPROVEMENT_COPY: Record<string, string> = {
  "Engineering Activity": "Commit more regularly — even small, frequent commits build stronger evidence than occasional large ones.",
  "Project Strength": "Flesh out your repo descriptions and READMEs — undocumented repos read as unfinished.",
  Consistency: "Spread your work out more — a few commits most weeks beats a single monthly burst.",
  Collaboration: "Contribute to an external project — even one small merged PR adds real collaboration evidence.",
  Impact: "Share your projects somewhere people will actually see them — stars and followers only grow from visibility.",
  Breadth: "Try a second language on a real project — depth in one language plus range in a second reads well.",
  Community: "Close a few issues or leave reviews on projects you use — community evidence is easy to build and rarely does.",
};

function buildCareerProof(card: CricketCardStats, parsedCv: ParsedCv | null, answers: CareerAnswers): CareerProofItem[] {
  const items: CareerProofItem[] = [];

  // Languages: the ONE skill category we have real GitHub-derived evidence for
  // (topLanguage). We deliberately do NOT claim evidence for frameworks/tools/
  // cloud/databases — RawGithubStats has no per-repo topic data, so any
  // "evidence strength" for those would be fabricated. Better to say "not
  // tracked" than to imply a check that never happened.
  if (parsedCv) {
    for (const lang of parsedCv.skills.languages) {
      const isTopLanguage = card.topLanguage && lang.toLowerCase() === card.topLanguage.toLowerCase();
      items.push({
        label: lang,
        claimedOn: ["CV"],
        evidence: isTopLanguage ? "Strong" : "Not tracked",
        note: isTopLanguage
          ? "Your most-used language on public GitHub."
          : "GitHub's public API only surfaces your single most-used language here — no signal either way for this one.",
      });
    }
    for (const category of ["frameworks", "tools", "cloud", "databases"] as const) {
      for (const item of parsedCv.skills[category]) {
        items.push({ label: item, claimedOn: ["CV"], evidence: "Not tracked", note: "Not tracked from public GitHub data in this build." });
      }
    }
  }

  // Experience level: a genuinely comparable claim vs. evidence pair — this is
  // the exact "claimed 5 years, GitHub shows ~2" example from the brief.
  if (answers.experienceLevel && answers.experienceLevel !== "Student") {
    items.push({
      label: "Years of experience",
      claimedOn: ["Answers"],
      evidence: card.activeYears >= 3 ? "Strong" : "Moderate",
      note: `Claimed: ${answers.experienceLevel} years. Public GitHub evidence: ~${card.activeYears} active ${card.activeYears === 1 ? "year" : "years"}. Private work (a day job's private repos) won't show up here.`,
    });
  }

  return items.slice(0, 20); // keep the page readable even on a skill-heavy resume
}

function buildImprovementActions(dimensions: DimensionBreakdown[], parsedCv: ParsedCv | null): string[] {
  const actions: string[] = [];

  const weakest = [...dimensions].filter((d) => d.verdict !== "Neutral").sort((a, b) => a.score - b.score)[0];
  if (weakest && IMPROVEMENT_COPY[weakest.label]) actions.push(IMPROVEMENT_COPY[weakest.label]);

  if (parsedCv) {
    const projectsWithoutMetrics = parsedCv.projects.filter((p) => p.description && !/\d/.test(p.description));
    if (projectsWithoutMetrics.length > 0) {
      actions.push("Add measurable impact to your CV project descriptions — numbers stick more than adjectives.");
    }
  }

  if (actions.length < 3) {
    actions.push("Contribute to an external project — even a small merged PR adds real collaboration evidence.");
  }

  return actions.slice(0, 3);
}

export function buildCareerProfile(card: CricketCardStats, parsedCv: ParsedCv | null, answers: CareerAnswers): CareerProfile {
  return {
    hasCv: parsedCv !== null,
    hasAnswers: Object.values(answers).some((v) => v !== null),
    person: parsedCv ? { name: parsedCv.person.name, links: parsedCv.person.links } : null,
    education: parsedCv?.education || [],
    experience: parsedCv?.experience || [],
    projects: parsedCv?.projects || [],
    skills: parsedCv?.skills || null,
    certifications: parsedCv?.certifications || [],
    answers,
    careerProof: card.dimensions ? buildCareerProof(card, parsedCv, answers) : [],
    improvementActions: card.dimensions ? buildImprovementActions(card.dimensions, parsedCv) : [],
  };
}
