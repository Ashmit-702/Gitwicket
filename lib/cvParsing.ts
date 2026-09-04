import { normalizeAndDedupeSkills } from "./skillNormalization";

// ============================================================================
// CV PARSING (heuristic, rule-based — NOT an LLM)
// ============================================================================
// This project has no LLM API key configured, and the brief is explicit:
// "Do not hallucinate missing information. Anything not found should remain
// null/unknown." A regex/keyword-based extractor structurally can't invent
// content — it either finds a pattern in the actual text or it doesn't.
//
// IMPORTANT: this module NEVER computes "years of professional experience."
// That's deliberate — see lib/careerProfile.ts and CareerQuestions.tsx. The
// brief is explicit that this is a user-provided career fact (Career
// Question 3), not something to be guessed from education dates or GitHub
// account age. Confusing the two produced the "Student yrs" bug this
// version fixes — experience years, current status (Student/Working/etc.),
// and education are three separate concepts and stay three separate fields
// all the way through this codebase.
//
// This module only ever runs server-side (called from app/api/parse-cv/route.ts).

export type ExtractionConfidence = "high" | "medium" | "low";

export interface ParsedCvPerson {
  name: string | null;
  email: string | null; // PRIVATE
  phone: string | null; // PRIVATE
  location: string | null; // PRIVATE
  links: { github: string | null; linkedin: string | null; portfolio: string | null };
}

export interface ParsedCvEducation {
  institution: string;
  degree: string | null;
  field: string | null;
  dates: string | null;
}

export interface ParsedCvExperience {
  company: string | null;
  role: string | null;
  dates: string | null;
  description: string | null;
  isInternship: boolean;
}

export interface ParsedCvProject {
  name: string;
  description: string | null;
  technologies: string[];
  githubUrl: string | null;
  demoUrl: string | null;
}

export interface ParsedCvSkills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  cloud: string[];
  databases: string[];
  concepts: string[]; // renamed from "other" — REST APIs, Microservices, Agile, etc.
}

export interface ParsedCvCertification {
  name: string;
  issuer: string | null;
  date: string | null;
}

export interface ParsedCv {
  person: ParsedCvPerson;
  summary: string | null;
  education: ParsedCvEducation[];
  experience: ParsedCvExperience[];
  projects: ParsedCvProject[];
  skills: ParsedCvSkills;
  certifications: ParsedCvCertification[];
  achievements: string[];
  extractionConfidence: ExtractionConfidence; // internal signal — UI translates this to plain language, never shows the word "confidence"
  extractionNote: string;
}

// ---------------------------------------------------------------------------
// Skill keyword lists. NOTE: bare "Go" is deliberately absent — see
// lib/skillNormalization.ts's header comment on why. Only "Golang" is matched.
// ---------------------------------------------------------------------------
const SKILL_KEYWORDS: Record<keyof ParsedCvSkills, string[]> = {
  languages: [
    "JavaScript", "TypeScript", "Python", "Java", "C\\+\\+", "C#", "C", "Golang", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "R", "Dart", "Perl", "Haskell", "Elixir", "MATLAB", "SQL", "Bash", "Shell",
  ],
  frameworks: [
    "React Native", "React", "Next\\.js", "Vue", "Nuxt", "Angular", "Svelte", "Django", "Flask", "FastAPI",
    "Express\\.js", "Express", "Spring Boot", "Spring", "\\.NET", "ASP\\.NET", "Node\\.js", "TensorFlow",
    "PyTorch", "Keras", "scikit-learn", "Pandas", "NumPy", "Rails", "Laravel", "Redux", "GraphQL", "jQuery",
    "Bootstrap", "Tailwind(?:CSS)?",
  ],
  tools: [
    "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "Jenkins", "Webpack", "Vite", "Figma", "Jira", "Postman",
    "CI/CD", "Linux", "Nginx", "Terraform", "Ansible", "Grafana", "Prometheus",
  ],
  cloud: [
    "AWS Lambda", "AWS", "GCP", "Azure", "Vercel", "Heroku", "Firebase", "DigitalOcean", "Cloudflare", "Netlify", "EC2", "S3",
  ],
  databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Cassandra", "Elasticsearch", "MariaDB", "Oracle", "Firestore"],
  concepts: ["REST APIs?", "Microservices", "Agile", "Scrum", "TDD", "OAuth", "WebSockets", "gRPC"],
};

const SECTION_HEADER_PATTERNS: Record<string, RegExp> = {
  summary: /^(summary|professional summary|objective|career objective|about( me)?)$/i,
  education: /^(education|academic background|relevant coursework)$/i,
  experience: /^(experience|work experience|professional experience|employment( history)?|internships?)$/i,
  projects: /^(projects?|personal projects?|selected projects?|academic projects?)$/i,
  skills: /^(skills|technical skills|skills\s*&\s*tools|core competenc(y|ies))$/i,
  certifications: /^(certifications?|licenses?( & certifications?)?)$/i,
  achievements: /^(achievements|awards|honors( & awards)?|publications|positions? of responsibility)$/i,
};

const MONTH_RE = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s+";
const DATE_RANGE_RE = new RegExp(
  `(?:${MONTH_RE})?((?:19|20)\\d{2}|present|current)\\s*[-–—to]{1,4}\\s*(?:${MONTH_RE})?((?:19|20)\\d{2}|present|current)`,
  "i"
);
const YEAR_RE = /(19|20)\d{2}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z.]{2,}/i;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const URL_RE = /(https?:\/\/[^\s,)]+|(?:www\.)?[\w-]+\.(?:com|dev|io|me|app|co|net|org|in|xyz|tech)(?:\/[^\s,)]*)?)/gi;
const INTERNSHIP_RE = /\bintern(ship)?\b/i;

/** Strips URL-like substrings out before skill keyword matching — otherwise a
 * skill regex like \bGitHub\b happily matches the literal text "github" inside
 * a "github.com/username" link, misattributing a URL fragment as a claimed skill. */
function stripUrls(text: string): string {
  return text.replace(URL_RE, " ");
}

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text.split("\n").map((l) => l.trim());
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  for (const line of lines) {
    if (!line) continue;
    const normalized = line.replace(/[:\-–—]+$/, "").trim();
    const matchedKey = Object.entries(SECTION_HEADER_PATTERNS).find(([, re]) => re.test(normalized))?.[0];
    if (matchedKey && normalized.length < 45) {
      current = matchedKey;
      sections[current] = sections[current] || [];
      continue;
    }
    if (current) {
      sections[current] = sections[current] || [];
      sections[current].push(line);
    }
  }
  return sections;
}

function groupIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line === "") {
      if (current.length) blocks.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);
  if (blocks.length <= 1 && lines.length > 6) {
    const chunked: string[][] = [];
    for (let i = 0; i < lines.length; i += 3) chunked.push(lines.slice(i, i + 3).filter(Boolean));
    return chunked.filter((b) => b.length > 0);
  }
  return blocks;
}

function extractSkillsRaw(fullText: string): ParsedCvSkills {
  const searchText = stripUrls(fullText); // see stripUrls() — prevents "github.com/x" matching the "GitHub" tool keyword
  const result: ParsedCvSkills = { languages: [], frameworks: [], tools: [], cloud: [], databases: [], concepts: [] };
  for (const category of Object.keys(SKILL_KEYWORDS) as (keyof ParsedCvSkills)[]) {
    for (const pattern of SKILL_KEYWORDS[category]) {
      const re = new RegExp(`\\b${pattern}\\b`, "i");
      const match = searchText.match(re);
      if (match) result[category].push(match[0]);
    }
  }
  return result;
}

function normalizeSkillSet(skills: ParsedCvSkills): ParsedCvSkills {
  return {
    languages: normalizeAndDedupeSkills(skills.languages),
    frameworks: normalizeAndDedupeSkills(skills.frameworks),
    tools: normalizeAndDedupeSkills(skills.tools),
    cloud: normalizeAndDedupeSkills(skills.cloud),
    databases: normalizeAndDedupeSkills(skills.databases),
    concepts: normalizeAndDedupeSkills(skills.concepts),
  };
}

function extractPerson(text: string): ParsedCvPerson {
  const lines = text.split("\n").map((l) => l.trim());
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);

  const textWithoutEmail = emailMatch ? text.replace(emailMatch[0], " ") : text;
  const urls = Array.from(textWithoutEmail.matchAll(URL_RE)).map((m) => m[0]);

  const github = urls.find((u) => /github\.com/i.test(u)) || null;
  const linkedin = urls.find((u) => /linkedin\.com/i.test(u)) || null;
  const portfolio = urls.find((u) => !/github\.com|linkedin\.com/i.test(u)) || null;

  let name: string | null = null;
  const nonNameHeaders = /^(curriculum vitae|resume|cv|bio\s*-?\s*data|profile)$/i;
  for (const line of lines.slice(0, 5)) {
    if (!line || EMAIL_RE.test(line) || URL_RE.test(line) || /\d/.test(line) || nonNameHeaders.test(line.trim())) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z.'-]*$/.test(w))) {
      name = line;
      break;
    }
  }

  return { name, email: emailMatch?.[0] || null, phone: phoneMatch?.[0] || null, location: null, links: { github, linkedin, portfolio } };
}

function extractEducation(lines: string[]): ParsedCvEducation[] {
  return groupIntoBlocks(lines)
    .map((block): ParsedCvEducation | null => {
      const joined = block.join(" ");
      const institutionLine = block.find((l) => /university|institute|college|school/i.test(l)) || block[0];
      if (!institutionLine) return null;
      const degreeMatch = joined.match(/\b(bachelor|master|ph\.?d|b\.?e\.?|b\.?tech|m\.?tech|b\.?s\.?c?|m\.?s\.?c?|associate)\b[^,\n]*?(?=\s*(?:19|20)\d{2}|$)/i);
      const dateMatch = joined.match(DATE_RANGE_RE) || joined.match(YEAR_RE);
      return {
        institution: institutionLine.trim(),
        degree: degreeMatch?.[0]?.trim() || null,
        field: null,
        dates: dateMatch?.[0]?.trim() || null,
      };
    })
    .filter((e): e is ParsedCvEducation => e !== null)
    .slice(0, 5);
}

// Deliberately does NOT derive or return a "years of experience" figure —
// see the module-level comment. Only structures what's literally stated.
function extractExperience(lines: string[]): ParsedCvExperience[] {
  return groupIntoBlocks(lines)
    .map((block): ParsedCvExperience | null => {
      const header = block[0];
      if (!header) return null;
      const blockText = block.join(" ");
      const dateMatch = blockText.match(DATE_RANGE_RE);
      let role: string | null = null;
      let company: string | null = null;
      const sep = header.match(/^(.+?)\s*[@|—-]\s*(.+)$/);
      if (sep) {
        [, role, company] = sep;
      } else {
        role = header;
        // Common resume convention: Role \n Company \n Dates \n bullets. If the
        // second line isn't itself a date, it's very likely the company name.
        const second = block[1];
        if (second && !DATE_RANGE_RE.test(second) && !YEAR_RE.test(second)) {
          company = second;
        }
      }
      const descriptionLines = block.slice(company ? 2 : 1).filter((l) => l !== dateMatch?.[0]);
      const description = descriptionLines.join(" ").replace(dateMatch?.[0] || "", "").trim().slice(0, 300) || null;
      return {
        company: company?.trim() || null,
        role: role?.trim() || null,
        dates: dateMatch?.[0]?.trim() || null,
        description,
        isInternship: INTERNSHIP_RE.test(blockText),
      };
    })
    .filter((e): e is ParsedCvExperience => e !== null)
    .slice(0, 8);
}

function extractProjects(lines: string[]): ParsedCvProject[] {
  return groupIntoBlocks(lines)
    .map((block): ParsedCvProject | null => {
      const name = block[0]?.replace(/[:\-–—]+$/, "").trim();
      if (!name) return null;
      const blockText = block.join(" ");
      const description = block.slice(1).join(" ").slice(0, 300) || null;
      const technologies = normalizeAndDedupeSkills(Object.values(extractSkillsRaw(blockText)).flat());
      const urls = Array.from(blockText.matchAll(URL_RE)).map((m) => m[0]);
      const githubUrl = urls.find((u) => /github\.com/i.test(u)) || null;
      const demoUrl = urls.find((u) => u !== githubUrl) || null;
      return { name, description, technologies, githubUrl, demoUrl };
    })
    .filter((p): p is ParsedCvProject => p !== null)
    .slice(0, 6);
}

function extractCertifications(lines: string[]): ParsedCvCertification[] {
  return lines
    .filter(Boolean)
    .map((line) => {
      const dateMatch = line.match(YEAR_RE);
      const parts = line.split(/[-–—,]/).map((p) => p.trim());
      return { name: parts[0], issuer: parts[1] || null, date: dateMatch?.[0] || null };
    })
    .slice(0, 8);
}

function assessConfidence(sections: Record<string, string[]>, text: string): ExtractionConfidence {
  const foundSections = Object.keys(sections).filter((k) => sections[k]?.length > 0).length;
  if (foundSections >= 3 && text.length > 400) return "high";
  if (foundSections >= 1 && text.length > 150) return "medium";
  return "low";
}

export function extractCvFields(text: string): ParsedCv {
  const sections = splitIntoSections(text);
  const confidence = assessConfidence(sections, text);

  return {
    person: extractPerson(text),
    summary: (sections.summary || []).join(" ").trim().slice(0, 400) || null,
    education: extractEducation(sections.education || []),
    experience: extractExperience(sections.experience || []),
    projects: extractProjects(sections.projects || []),
    skills: normalizeSkillSet(extractSkillsRaw(text)),
    certifications: extractCertifications(sections.certifications || []),
    achievements: (sections.achievements || []).filter(Boolean).slice(0, 5),
    extractionConfidence: confidence,
    extractionNote:
      confidence === "low"
        ? "Some information couldn't be extracted from this CV. You can review and complete your profile manually."
        : "Extracted with best-effort pattern matching, not an AI reader — it can miss things on unusually formatted resumes. Nothing here was guessed; anything not clearly found was left blank.",
  };
}
