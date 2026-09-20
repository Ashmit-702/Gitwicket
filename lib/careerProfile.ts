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
  // Q5 — a stable reference into the canonical projects[] list, NOT a copied title
  // string. Storing the string directly meant a re-parsed CV (different title
  // casing, a corrected typo, etc.) could silently orphan the answer or match
  // the wrong project. "other" is the explicit sentinel for "none of these" —
  // paired with otherProjectText for free text in that case.
  proudestProjectId: string | null; // index into parsedCv.projects (as a string) OR "other" OR null (unanswered)
  otherProjectText: string | null; // only meaningful when proudestProjectId === "other"
  personalContribution: string | null; // Q6 — what THEY personally built, separate from the project's existence
  twelveMonthGoal: string | null; // Q7
  // Structured conditional follow-ups — asked based on the Q2 answer, not as
  // flat extra questions everyone sees. Keeps the questionnaire adaptive
  // rather than a longer fixed form.
  companyOrOrg: string | null; // shown when currentStatus is Working/Freelancing/Building a startup
  expectedGraduationYear: string | null; // shown when currentStatus is Student
  location: string | null; // general, always-optional
  workMode: string | null; // Remote / Hybrid / On-site / Flexible — genuinely useful "career readiness" context
  openToRelocation: string | null; // Yes / No / Depends
  linkedinUrl: string | null; // optional, display-only — see Career Card "Sources"; never scraped, never a rating input
}

export const EMPTY_ANSWERS: CareerAnswers = {
  targetRole: null,
  currentStatus: null,
  experienceYears: null,
  primaryFocus: [],
  proudestProjectId: null,
  otherProjectText: null,
  personalContribution: null,
  twelveMonthGoal: null,
  companyOrOrg: null,
  expectedGraduationYear: null,
  location: null,
  workMode: null,
  openToRelocation: null,
  linkedinUrl: null,
};

export type EvidenceStatus = "Strong evidence" | "Moderate evidence" | "Limited evidence" | "No public evidence" | "Not enough data";

export interface CareerProofItem {
  label: string;
  claimedOn: ("CV" | "Answers")[];
  claimDetail: string; // e.g. "Yes" for a skill, or the actual claimed value for things like years of experience
  evidenceDetail: string; // e.g. "2 repositories · primary language · recently active" — the factual finding, kept separate from status wording
  status: EvidenceStatus;
}

export type DeploymentStatus = "deployed-with-traction" | "deployed-limited-traction" | "github-only" | "no-public-evidence";

export interface ProjectMatch {
  id: string; // stable within one parsed CV's lifetime — see CareerAnswers.proudestProjectId
  project: ParsedCvProject;
  githubMatch: { name: string; url: string; confidence: "likely" | "possible" } | null;
  // Deployment and public traction are DIFFERENT things — this was a real, confirmed
  // bug in the old recommendation copy ("publish this project" for a project that
  // was already deployed with a live demo, just without many stars). deployed =
  // does a working demo URL exist (CV-stated OR the matched repo's own homepage
  // field). traction = separate evidence of reach (stars). A project can be
  // deployed with zero traction, or have some traction with no deploy — never
  // conflate the two.
  deploymentStatus: DeploymentStatus;
  demoUrl: string | null;
}

export interface CareerProfile {
  hasCv: boolean;
  hasAnswers: boolean;
  person: { name: string | null; links: ParsedCv["person"]["links"] } | null; // PUBLIC subset only — never email/phone/location
  summary: string | null;
  education: ParsedCv["education"];
  experience: ParsedCv["experience"];
  projectMatches: ProjectMatch[];
  proudestProjectId: string | null; // echoes answers.proudestProjectId — resolve against projectMatches by .id, never re-match by name/string
  skills: ParsedCv["skills"] | null;
  certifications: ParsedCv["certifications"];
  answers: CareerAnswers;
  careerProof: CareerProofItem[];
  improvementActions: string[];
  consistencyInsights: string[]; // CV <-> GitHub agreement/gap observations — see buildConsistencyInsights
  roleAlignment: RoleAlignment | null; // only populated when answers.targetRole is set
  lowConfidenceExtraction: boolean;
}

export interface RoleAlignment {
  role: string;
  strong: string[]; // skills expected for this role with Strong/Moderate evidence
  needsEvidence: string[]; // skills expected for this role with Limited/No evidence
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
function evidenceForLanguage(label: string, repos: { primaryLanguage: string | null; pushedAt: string }[]): CareerProofItem {
  const base = { label, claimedOn: ["CV"] as ("CV" | "Answers")[], claimDetail: "Yes" };
  const matching = repos.filter((r) => r.primaryLanguage && normalizeSkill(r.primaryLanguage).toLowerCase() === label.toLowerCase());
  if (matching.length === 0) {
    return { ...base, evidenceDetail: "No matching public repository found", status: "No public evidence" };
  }
  const recentCount = matching.filter((r) => Date.now() - new Date(r.pushedAt).getTime() < RECENT_MS).length;
  const repoWord = matching.length === 1 ? "repository" : "repositories";
  const recency = recentCount > 0 ? "recently active" : `last active ${monthsAgo(matching[0].pushedAt)} months ago`;
  const evidenceDetail = `${matching.length} ${repoWord} · primary language · ${recency}`;

  if (matching.length >= 3 || (matching.length >= 2 && recentCount > 0)) {
    return { ...base, evidenceDetail, status: "Strong evidence" };
  }
  if (matching.length >= 1 && recentCount > 0) {
    return { ...base, evidenceDetail, status: "Moderate evidence" };
  }
  return { ...base, evidenceDetail, status: "Limited evidence" };
}

/**
 * Non-language skills (frameworks/tools/cloud/databases). Combines THREE
 * independent public signals instead of the old single "text search in repo
 * description" check that was under-crediting real evidence (Flask/FastAPI/
 * scikit-learn/etc. showing "No public evidence" despite being genuinely
 * present in the person's actual projects):
 *
 *   1. Repo TOPICS (a repo explicitly tagged "flask") — a real, deliberate
 *      signal the repo owner set, not a guess.
 *   2. Repo name/description text match — weaker, but still real.
 *   3. PROJECT CROSS-REFERENCE — the CV project itself claims this technology
 *      AND that project has a confirmed/likely match to a public GitHub repo.
 *      This was previously computed (projectMatches) but never fed back into
 *      Career Proof at all, which is exactly why frameworks the person
 *      obviously used in a matched project still showed "No public evidence."
 *
 * Definitions (matching the product brief exactly):
 *   Strong:   2+ of the signals above hit independently
 *   Moderate: exactly 1 signal hits, and it's a meaningful one (topic or
 *             project cross-reference — not just a bare substring match)
 *   Limited:  only a weak/indirect signal (name/description text match, with
 *             no recent activity behind it)
 *   No public evidence: nothing found at all
 */
function evidenceForTextSkill(
  label: string,
  repos: { name: string; description: string | null; topics: string[]; pushedAt: string }[],
  projectMatches: ProjectMatch[]
): CareerProofItem {
  const base = { label, claimedOn: ["CV"] as ("CV" | "Answers")[], claimDetail: "Yes" };
  const needle = label.toLowerCase();

  const textMatches = repos.filter((r) => `${r.name} ${r.description || ""}`.toLowerCase().includes(needle));
  const topicMatches = repos.filter((r) => r.topics.some((t) => t.toLowerCase().includes(needle) || needle.includes(t.toLowerCase())));
  const crossRef = projectMatches.find((pm) => pm.githubMatch && pm.project.technologies.some((t) => t.toLowerCase() === needle));

  const signalCount = [textMatches.length > 0, topicMatches.length > 0, !!crossRef].filter(Boolean).length;
  if (signalCount === 0) {
    return { ...base, evidenceDetail: "Not mentioned in any repository name, description, or topic", status: "No public evidence" };
  }

  const parts: string[] = [];
  if (topicMatches.length > 0) parts.push(`tagged as a topic on ${topicMatches.length} ${topicMatches.length === 1 ? "repo" : "repos"}`);
  if (crossRef) parts.push(`used in your "${crossRef.project.name}" project, matched to a public repository`);
  if (textMatches.length > 0) parts.push(`mentioned in ${textMatches.length} repo name/description`);
  const evidenceDetail = parts.join(" · ");

  if (signalCount >= 2) return { ...base, evidenceDetail, status: "Strong evidence" };
  if (topicMatches.length > 0 || crossRef) return { ...base, evidenceDetail, status: "Moderate evidence" };

  const recentAny = textMatches.some((r) => Date.now() - new Date(r.pushedAt).getTime() < RECENT_MS);
  return { ...base, evidenceDetail, status: recentAny ? "Moderate evidence" : "Limited evidence" };
}

function buildCareerProof(
  card: CricketCardStats,
  parsedCv: ParsedCv | null,
  answers: CareerAnswers,
  repos: CricketCardStats["repos"],
  projectMatches: ProjectMatch[]
): CareerProofItem[] {
  const items: CareerProofItem[] = [];
  const repoList = repos || [];
  const noDataItem = (label: string): CareerProofItem => ({
    label,
    claimedOn: ["CV"],
    claimDetail: "Yes",
    evidenceDetail: "No public repository data available for this account",
    status: "Not enough data",
  });

  if (parsedCv) {
    for (const lang of parsedCv.skills.languages) {
      items.push(repoList.length > 0 ? evidenceForLanguage(lang, repoList) : noDataItem(lang));
    }
    for (const category of ["frameworks", "tools", "cloud", "databases"] as const) {
      for (const item of parsedCv.skills[category]) {
        items.push(repoList.length > 0 ? evidenceForTextSkill(item, repoList, projectMatches) : noDataItem(item));
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
      claimDetail: answers.experienceYears,
      evidenceDetail: `~${card.activeYears} active ${card.activeYears === 1 ? "year" : "years"} of public GitHub activity. Private work (e.g. a day job's private repos) won't show up here — this is public evidence, not total real-world experience.`,
      status: card.activeYears >= 3 ? "Strong evidence" : card.activeYears >= 1 ? "Moderate evidence" : "Limited evidence",
    });
  }

  // Cap at 10 for a scannable card (Part 12: "shorter and better," not every parsed
  // skill dumped onto the page) — prioritize items with actual evidence findings
  // over a long unverified tail, so the most informative rows survive the cut.
  const statusOrder: Record<EvidenceStatus, number> = {
    "Strong evidence": 0,
    "Moderate evidence": 1,
    "Limited evidence": 2,
    "No public evidence": 3,
    "Not enough data": 4,
  };
  return [...items].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]).slice(0, 10);
}

/**
 * Best-effort, conservative CV-project <-> GitHub-repo matching. Rewritten to use
 * a real bidirectional word-overlap score rather than an arbitrary point tally —
 * the old version under-credited common, obviously-correct matches like project
 * "ASHLYSIS - AI Exam Intelligence Platform" vs. repo "ai-exam-platform" (nearly
 * every meaningful word in the repo name appears in the project title, which is
 * about as confident as this kind of heuristic match gets), showing "Possible
 * GitHub match" when "GitHub match" was warranted.
 */
function matchProjectsToRepos(projects: ParsedCvProject[], repos: CricketCardStats["repos"]): ProjectMatch[] {
  const repoList = repos || [];
  const wordsOf = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/[\s-]+/)
        .filter((w) => w.length > 2)
    );

  // "Real traction" bar — arbitrary but documented: a couple of friend-stars
  // shouldn't count as traction, but this is deliberately a low bar, not a
  // popularity contest (that's what the Impact rating dimension is for).
  const TRACTION_STAR_THRESHOLD = 3;

  return projects.map((project, index) => {
    const id = String(index);
    const projectWords = wordsOf(project.name);
    let best: { name: string; url: string; homepageUrl: string | null; stars: number; overlapFractionOfRepo: number } | null = null;

    for (const repo of repoList) {
      const repoWords = wordsOf(repo.name);
      if (repoWords.size === 0) continue;

      const repoNameOverlap = [...repoWords].filter((w) => projectWords.has(w)).length;
      const overlapFractionOfRepo = repoNameOverlap / repoWords.size; // how much of the REPO name is explained by the project title

      if (!best || overlapFractionOfRepo > best.overlapFractionOfRepo) {
        best = { name: repo.name, url: repo.url, homepageUrl: repo.homepageUrl, stars: repo.stars, overlapFractionOfRepo };
      }
    }

    // Deployment: a demo URL from the CV itself, OR the matched repo's own
    // "homepage" field (GitHub's real field for a deployed site link) — checked
    // independently of match confidence, since the CV author stating their own
    // demo URL is already good evidence on its own.
    const demoUrl = project.demoUrl || best?.homepageUrl || null;
    let deploymentStatus: DeploymentStatus;
    if (demoUrl) {
      deploymentStatus = (best?.stars ?? 0) >= TRACTION_STAR_THRESHOLD ? "deployed-with-traction" : "deployed-limited-traction";
    } else if (best && best.overlapFractionOfRepo >= 0.3) {
      deploymentStatus = "github-only";
    } else {
      deploymentStatus = "no-public-evidence";
    }

    if (!best || best.overlapFractionOfRepo < 0.3) return { id, project, githubMatch: null, deploymentStatus, demoUrl };
    // "Likely": most of the repo's own name is explained by the project title —
    // this is the strong, symmetric signal (not just "one word happened to match").
    const confidence: "likely" | "possible" = best.overlapFractionOfRepo >= 0.6 ? "likely" : "possible";
    return { id, project, githubMatch: { name: best.name, url: best.url, confidence }, deploymentStatus, demoUrl };
  });
}

function buildImprovementActions(
  dimensions: DimensionBreakdown[],
  parsedCv: ParsedCv | null,
  careerProof: CareerProofItem[],
  projectMatches: ProjectMatch[]
): string[] {
  const actions: string[] = [];

  // 1. Weakest genuine (non-neutral) dimension, phrased with the actual evidence behind it.
  // Impact specifically now checks REAL deployment state first — this is the fix for a
  // confirmed bug: telling someone to "publish your project with a demo link" when they
  // already have one deployed is wrong and undermines trust in the whole recommendation
  // engine. Deployment and public traction are different things; the copy below only
  // ever recommends deploying if nothing in projectMatches is actually deployed.
  const weakest = [...dimensions].filter((d) => d.verdict !== "Neutral").sort((a, b) => a.score - b.score)[0];
  if (weakest) {
    if (weakest.label === "Impact") {
      const anyDeployed = projectMatches.some((m) => m.deploymentStatus === "deployed-with-traction" || m.deploymentStatus === "deployed-limited-traction");
      if (anyDeployed) {
        actions.push(
          "Your strongest projects are already deployed — the gap is public traction, not deployment. Improve discoverability with a polished README, screenshots, and a clearly linked demo."
        );
      } else {
        actions.push("Your engineering evidence is solid, but nothing is publicly deployed yet. Publish 1-2 of your strongest projects with a working demo link.");
      }
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
  // signal available, so it's prioritized over generic advice. Uses the actual finding
  // (gap.evidenceDetail) rather than re-describing it, so the advice and the Career Proof
  // table below it never say two slightly different things about the same skill.
  const gap = careerProof.find((p) => p.status === "Limited evidence" || p.status === "No public evidence");
  if (gap) {
    actions.push(`Your CV lists ${gap.label}, but ${gap.evidenceDetail.toLowerCase()}. Add or document a project that clearly uses it.`);
  }

  // 3. CV-quality check: projects without any measurable outcome.
  if (parsedCv && actions.length < 3) {
    const noMetrics = parsedCv.projects.filter((p) => p.description && !/\d/.test(p.description));
    if (noMetrics.length > 0) {
      actions.push("Several project descriptions lack measurable outcomes. Add metrics — users, latency, accuracy, scale — anywhere they're truthfully available.");
    }
  }

  if (actions.length === 0) {
    actions.push("Contribute to an external project — even a small merged PR adds real collaboration evidence.");
  }

  return actions.slice(0, 3);
}

/**
 * CV <-> GitHub consistency observations (Part 15). Deliberately simple,
 * count-based comparisons — no fuzzy claims about "how well your CV matches
 * your work," just factual observations a reader can verify themselves.
 */
function buildConsistencyInsights(parsedCv: ParsedCv | null, careerProof: CareerProofItem[], projectMatches: ProjectMatch[]): string[] {
  if (!parsedCv) return [];
  const insights: string[] = [];

  const claimedSkillCount = Object.values(parsedCv.skills).flat().length;
  const evidencedSkillCount = careerProof.filter((p) => p.status === "Strong evidence" || p.status === "Moderate evidence").length;
  if (claimedSkillCount > 0) {
    insights.push(`Your CV lists ${claimedSkillCount} skills, ${evidencedSkillCount} with meaningful public evidence.`);
  }

  const matchedProjects = projectMatches.filter((m) => m.githubMatch);
  if (parsedCv.projects.length > 0) {
    insights.push(`${matchedProjects.length} of ${parsedCv.projects.length} CV projects have a matching public GitHub repository.`);
  }

  // Surface the single strongest unmatched project as a specific, actionable observation
  // rather than a vague "add more projects."
  const unmatched = projectMatches.find((m) => !m.githubMatch);
  if (unmatched) {
    insights.push(`"${unmatched.project.name}" is on your CV but doesn't have a clearly matching public repository — worth double-checking it's public and named recognizably.`);
  }

  return insights.slice(0, 3);
}

// Representative skill keywords per target role — deliberately a starting set, not
// exhaustive. Used only to sort ALREADY-COMPUTED Career Proof evidence into "strong
// for this role" vs "needs evidence for this role" — this never invents a score or
// predicts hireability, it just re-groups real evidence through the lens of the
// role the person said they're targeting.
const ROLE_SKILL_HINTS: Record<string, string[]> = {
  "AI/ML Engineer": ["python", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy"],
  "Data Scientist": ["python", "pandas", "numpy", "scikit-learn", "sql"],
  "Data Engineer": ["python", "sql", "spark", "airflow", "postgresql"],
  "Backend Developer": ["node.js", "python", "java", "postgresql", "mongodb", "rest apis"],
  "Frontend Developer": ["javascript", "typescript", "react", "vue", "next.js"],
  "Full Stack Developer": ["javascript", "typescript", "react", "node.js", "postgresql"],
  "DevOps / Cloud": ["docker", "kubernetes", "aws", "terraform", "ci/cd"],
  "Site Reliability Engineer (SRE)": ["docker", "kubernetes", "aws", "terraform", "prometheus"],
  "Mobile Developer": ["swift", "kotlin", "react native"],
  "SDE (Software Development Engineer)": ["java", "python", "c++", "javascript", "rest apis"],
  "FDE (Forward Deployed Engineer)": ["python", "javascript", "rest apis", "sql"],
};

function buildRoleAlignment(targetRole: string | null, careerProof: CareerProofItem[]): RoleAlignment | null {
  if (!targetRole) return null;
  const hints = ROLE_SKILL_HINTS[targetRole];
  if (!hints) return null;

  const strong: string[] = [];
  const needsEvidence: string[] = [];
  for (const hint of hints) {
    const item = careerProof.find((p) => p.label.toLowerCase() === hint);
    if (!item) continue; // not claimed at all — not a gap to call out, just absent from the CV
    if (item.status === "Strong evidence" || item.status === "Moderate evidence") strong.push(item.label);
    else needsEvidence.push(item.label);
  }
  if (strong.length === 0 && needsEvidence.length === 0) return null;
  return { role: targetRole, strong, needsEvidence };
}

export function buildCareerProfile(card: CricketCardStats, parsedCv: ParsedCv | null, answers: CareerAnswers): CareerProfile {
  const projectMatches = parsedCv ? matchProjectsToRepos(parsedCv.projects, card.repos) : [];
  const careerProof = card.dimensions ? buildCareerProof(card, parsedCv, answers, card.repos, projectMatches) : [];
  return {
    hasCv: parsedCv !== null,
    hasAnswers: Object.values(answers).some((v) => (Array.isArray(v) ? v.length > 0 : v !== null)),
    person: parsedCv ? { name: parsedCv.person.name, links: parsedCv.person.links } : null,
    summary: parsedCv?.summary || null,
    education: parsedCv?.education || [],
    experience: parsedCv?.experience || [],
    projectMatches,
    proudestProjectId: answers.proudestProjectId,
    skills: parsedCv?.skills || null,
    certifications: parsedCv?.certifications || [],
    answers,
    careerProof,
    improvementActions: card.dimensions ? buildImprovementActions(card.dimensions, parsedCv, careerProof, projectMatches) : [],
    consistencyInsights: buildConsistencyInsights(parsedCv, careerProof, projectMatches),
    roleAlignment: buildRoleAlignment(answers.targetRole, careerProof),
    lowConfidenceExtraction: parsedCv?.extractionConfidence === "low",
  };
}
