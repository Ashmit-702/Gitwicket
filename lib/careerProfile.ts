import type { CricketCardStats, DimensionBreakdown } from "./cricketStats";
import type { ParsedCv, ParsedCvProject } from "./cvParsing";
import { normalizeSkill } from "./skillNormalization";

// ============================================================================
// CAREER ANALYSIS — separate from Rating Analysis (lib/rating.ts), which stays
// frozen. Nothing here can move the rating; it only reads an already-computed
// CricketCardStats and adds a presentation/analysis layer on top.
//
// THREE DISTINCT PRINCIPLES (kept deliberately unblurred throughout this file):
//   RATING:       how strong is your public engineering profile? (lib/rating.ts)
//   CAREER CARD:  who are you professionally? (this file's non-proof fields)
//   CAREER PROOF: how much public evidence supports what you claim? (careerProof below)
// ============================================================================

// ---------------------------------------------------------------------------
// Career Questions — 7 questions + 1 optional LinkedIn URL field, matching the
// product brief exactly. "Current status" (Q2) and "years of professional
// experience" (Q3) are deliberately SEPARATE fields — conflating them (e.g.
// storing "Student" where a number of years was expected) was the exact "Student
// yrs" bug this version fixes. Experience years is a user-provided career fact;
// it is never inferred from education dates or GitHub account age anywhere in
// this codebase.
// ---------------------------------------------------------------------------

export interface CareerAnswers {
  targetRole: string | null; // Q1 — Frontend Developer / Backend Developer / ... / Other
  currentStatus: string | null; // Q2 — Student / Looking for internship / Working / ...
  experienceYears: string | null; // Q3 — "No professional experience" / "<1 year" / "1-2 years" / ... — NEVER "Student"
  primaryFocus: string[]; // Q4 — one or two selections, e.g. ["AI/ML", "Backend"]
  proudestProject: string | null; // Q5 — free text OR the name of a detected CV/GitHub project
  personalContribution: string | null; // Q6 — what THEY personally built, separate from the project's existence
  twelveMonthGoal: string | null; // Q7
  linkedinUrl: string | null; // optional, display-only — see Career Card "Sources"; never scraped, never a rating input
}

export const EMPTY_ANSWERS: CareerAnswers = {
  targetRole: null,
  currentStatus: null,
  experienceYears: null,
  primaryFocus: [],
  proudestProject: null,
  personalContribution: null,
  twelveMonthGoal: null,
  linkedinUrl: null,
};

export type EvidenceStatus = "Strong evidence" | "Moderate evidence" | "Limited evidence" | "No public evidence" | "Not enough data";

export interface CareerProofItem {
  label: string;
  claimedOn: ("CV" | "Answers")[];
  status: EvidenceStatus;
  evidenceSummary: string; // e.g. "3 repos primarily in Python, most recently active 2 months ago"
}

export interface ProjectMatch {
  project: ParsedCvProject;
  githubMatch: { name: string; url: string; confidence: "likely" | "possible" } | null;
}

export interface CareerProfile {
  hasCv: boolean;
  hasAnswers: boolean;
  person: { name: string | null; links: ParsedCv["person"]["links"] } | null; // PUBLIC subset only — never email/phone/location
  summary: string | null;
  education: ParsedCv["education"];
  experience: ParsedCv["experience"];
  projectMatches: ProjectMatch[];
  skills: ParsedCv["skills"] | null;
  certifications: ParsedCv["certifications"];
  answers: CareerAnswers;
  careerProof: CareerProofItem[];
  improvementActions: string[];
  lowConfidenceExtraction: boolean;
}

const RECENT_MS = 12 * 30 * 24 * 60 * 60 * 1000; // ~12 months, for "recent activity" evidence language

function monthsAgo(dateIso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(dateIso).getTime()) / (30 * 24 * 60 * 60 * 1000)));
}

/**
 * Real per-language evidence from actual repo data — this is the fix for the
 * old "Not tracked" wall. Every claimed language is checked against the
 * account's actual repos (primary language per repo, from lib/github.ts's
 * GraphQL fetch), not just a single aggregate "topLanguage" field.
 */
function evidenceForLanguage(label: string, card: CricketCardStats, repos: { primaryLanguage: string | null; pushedAt: string }[]): CareerProofItem {
  const matching = repos.filter((r) => r.primaryLanguage && normalizeSkill(r.primaryLanguage).toLowerCase() === label.toLowerCase());
  if (matching.length === 0) {
    return { label, claimedOn: ["CV"], status: "No public evidence", evidenceSummary: "No repositories found with this as the primary language." };
  }
  const recentCount = matching.filter((r) => Date.now() - new Date(r.pushedAt).getTime() < RECENT_MS).length;
  const repoWord = matching.length === 1 ? "repository" : "repositories";
  const recency = recentCount > 0 ? "recently active" : `last active ${monthsAgo(matching[0].pushedAt)} months ago`;
  const summary = `${matching.length} ${repoWord} primarily in ${label}, ${recency}.`;

  if (matching.length >= 3 || (matching.length >= 1 && recentCount > 0 && matching.length >= 2)) {
    return { label, claimedOn: ["CV"], status: "Strong evidence", evidenceSummary: summary };
  }
  if (matching.length >= 1 && recentCount > 0) {
    return { label, claimedOn: ["CV"], status: "Moderate evidence", evidenceSummary: summary };
  }
  return { label, claimedOn: ["CV"], status: "Limited evidence", evidenceSummary: summary };
}

/**
 * Non-language skills (frameworks/tools/cloud/databases) have no structured
 * per-repo field to check — GitHub's API doesn't expose per-repo topics/tech
 * stacks cheaply. The honest, non-fabricated evidence source available is
 * text matching against repo names + descriptions. This is explicitly weaker
 * than the language check above and is labeled conservatively — a text match
 * only ever reaches "Moderate", never "Strong", because a mention in a repo
 * description isn't the same strength of signal as "this repo's primary
 * language is X."
 */
function evidenceForTextSkill(label: string, repos: { name: string; description: string | null; pushedAt: string }[]): CareerProofItem {
  const needle = label.toLowerCase();
  const matches = repos.filter((r) => `${r.name} ${r.description || ""}`.toLowerCase().includes(needle));
  if (matches.length === 0) {
    return { label, claimedOn: ["CV"], status: "No public evidence", evidenceSummary: "Not mentioned in any repository name or description." };
  }
  const recentCount = matches.filter((r) => Date.now() - new Date(r.pushedAt).getTime() < RECENT_MS).length;
  const repoWord = matches.length === 1 ? "repo" : "repos";
  return {
    label,
    claimedOn: ["CV"],
    status: recentCount > 0 ? "Moderate evidence" : "Limited evidence",
    evidenceSummary: `Mentioned in ${matches.length} ${repoWord}${recentCount > 0 ? ", recently active" : ", but no recent activity"}.`,
  };
}

function buildCareerProof(card: CricketCardStats, parsedCv: ParsedCv | null, answers: CareerAnswers, repos: CricketCardStats["repos"]): CareerProofItem[] {
  const items: CareerProofItem[] = [];
  const repoList = repos || [];

  if (parsedCv) {
    for (const lang of parsedCv.skills.languages) {
      items.push(repoList.length > 0 ? evidenceForLanguage(lang, card, repoList) : { label: lang, claimedOn: ["CV"], status: "Not enough data", evidenceSummary: "No public repository data available for this account." });
    }
    for (const category of ["frameworks", "tools", "cloud", "databases"] as const) {
      for (const item of parsedCv.skills[category]) {
        items.push(repoList.length > 0 ? evidenceForTextSkill(item, repoList) : { label: item, claimedOn: ["CV"], status: "Not enough data", evidenceSummary: "No public repository data available for this account." });
      }
    }
  }

  // Time claim: purely Answers vs. GitHub — CV is never the source of a years-of-experience
  // number in this codebase (see module header). "No professional experience" and null are
  // both skipped since there's no claim to check evidence against.
  if (answers.experienceYears && answers.experienceYears !== "No professional experience") {
    items.push({
      label: "Years of professional experience",
      claimedOn: ["Answers"],
      status: card.activeYears >= 3 ? "Strong evidence" : card.activeYears >= 1 ? "Moderate evidence" : "Limited evidence",
      evidenceSummary: `Claimed: ${answers.experienceYears}. Public GitHub evidence: ~${card.activeYears} active ${card.activeYears === 1 ? "year" : "years"}. Private work (e.g. a day job's private repos) won't show up here — this is public evidence, not total real-world experience.`,
    });
  }

  return items.slice(0, 24);
}

/** Best-effort, conservative CV-project <-> GitHub-repo matching by name/description overlap. Never claims certainty it doesn't have. */
function matchProjectsToRepos(projects: ParsedCvProject[], repos: CricketCardStats["repos"]): ProjectMatch[] {
  const repoList = repos || [];
  return projects.map((project) => {
    const projectWords = project.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2);
    let best: { name: string; url: string; score: number } | null = null;
    for (const repo of repoList) {
      const repoName = repo.name.toLowerCase();
      const repoDesc = (repo.description || "").toLowerCase();
      let score = 0;
      if (repoName === project.name.toLowerCase().replace(/\s+/g, "-") || repoName === project.name.toLowerCase().replace(/\s+/g, "")) score += 3;
      for (const w of projectWords) {
        if (repoName.includes(w)) score += 1;
        if (repoDesc.includes(w)) score += 0.5;
      }
      if (!best || score > best.score) best = { name: repo.name, url: repo.url, score };
    }
    if (!best || best.score < 1) return { project, githubMatch: null };
    return { project, githubMatch: { name: best.name, url: best.url, confidence: best.score >= 3 ? "likely" : "possible" } };
  });
}

function buildImprovementActions(dimensions: DimensionBreakdown[], parsedCv: ParsedCv | null, careerProof: CareerProofItem[]): string[] {
  const actions: string[] = [];

  // 1. Weakest genuine (non-neutral) dimension, phrased with the actual evidence behind it.
  const weakest = [...dimensions].filter((d) => d.verdict !== "Neutral").sort((a, b) => a.score - b.score)[0];
  if (weakest) {
    if (weakest.label === "Impact") {
      actions.push("Your engineering evidence is solid, but public visibility is limited. Publish 1-2 of your strongest projects somewhere people will see them, with a working demo link.");
    } else if (weakest.label === "Consistency") {
      actions.push(`Your activity is concentrated rather than spread out (${weakest.evidence[0] || "based on your commit history"}). A few commits most weeks reads stronger than occasional large bursts.`);
    } else if (weakest.label === "Collaboration") {
      actions.push("You have limited external collaboration evidence. A small merged open-source contribution would strengthen this area — it doesn't need to be big.");
    } else if (weakest.label === "Project Strength") {
      actions.push("Several of your repos are missing descriptions or licenses. Filling those in makes finished work look finished.");
    } else {
      actions.push(`${weakest.label} is your current limiting factor — ${weakest.evidence[0] || "see the breakdown above for specifics"}.`);
    }
  }

  // 2. A specific CV-claim-vs-evidence gap, if one exists — this is the most personalized
  // signal available, so it's prioritized over generic advice.
  const gap = careerProof.find((p) => p.status === "Limited evidence" || p.status === "No public evidence");
  if (gap) {
    actions.push(
      `Your CV lists ${gap.label}, but your public project evidence is ${gap.status === "No public evidence" ? "not visible" : "limited"}. Add or document a project that clearly uses it.`
    );
  }

  // 3. CV-quality check: projects without any measurable outcome.
  if (parsedCv) {
    const noMetrics = parsedCv.projects.filter((p) => p.description && !/\d/.test(p.description));
    if (noMetrics.length > 0 && actions.length < 3) {
      actions.push("Add measurable impact to your CV project descriptions — numbers stick more than adjectives.");
    }
  }

  if (actions.length === 0) {
    actions.push("Contribute to an external project — even a small merged PR adds real collaboration evidence.");
  }

  return actions.slice(0, 3);
}

export function buildCareerProfile(card: CricketCardStats, parsedCv: ParsedCv | null, answers: CareerAnswers): CareerProfile {
  const careerProof = card.dimensions ? buildCareerProof(card, parsedCv, answers, card.repos) : [];
  return {
    hasCv: parsedCv !== null,
    hasAnswers: Object.values(answers).some((v) => (Array.isArray(v) ? v.length > 0 : v !== null)),
    person: parsedCv ? { name: parsedCv.person.name, links: parsedCv.person.links } : null,
    summary: parsedCv?.summary || null,
    education: parsedCv?.education || [],
    experience: parsedCv?.experience || [],
    projectMatches: parsedCv ? matchProjectsToRepos(parsedCv.projects, card.repos) : [],
    skills: parsedCv?.skills || null,
    certifications: parsedCv?.certifications || [],
    answers,
    careerProof,
    improvementActions: card.dimensions ? buildImprovementActions(card.dimensions, parsedCv, careerProof) : [],
    lowConfidenceExtraction: parsedCv?.extractionConfidence === "low",
  };
}
