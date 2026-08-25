// ============================================================================
// CV PARSING (heuristic, rule-based — NOT an LLM)
// ============================================================================
// This project has no LLM API key configured, and the brief is explicit:
// "Do not hallucinate missing information. Anything not found should remain
// null/unknown." A regex/keyword-based extractor structurally can't invent
// content — it either finds a pattern in the actual text or it doesn't. The
// tradeoff is real: this will miss things a human (or an LLM) would catch,
// especially on unusually formatted resumes. That tradeoff is the right one
// for a "don't make things up" requirement, and it's called out explicitly
// in the UI (see the parse-result screen) rather than hidden.
//
// This module only ever runs server-side (called from app/api/parse-cv/route.ts).
// It receives raw extracted text, never a file path, and returns structured
// data only — no raw text is retained in the return value, so nothing here
// can accidentally leak the full document further downstream.

export interface ParsedCvPerson {
  name: string | null;
  email: string | null; // PRIVATE — see app/api/parse-cv/route.ts and CareerCard privacy notes
  phone: string | null; // PRIVATE
  location: string | null; // PRIVATE — treated conservatively even though a city isn't a full address
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
}

export interface ParsedCvProject {
  name: string;
  description: string | null;
  technologies: string[];
}

export interface ParsedCvSkills {
  languages: string[];
  frameworks: string[];
  tools: string[];
  cloud: string[];
  databases: string[];
  other: string[];
}

export interface ParsedCvCertification {
  name: string;
  issuer: string | null;
  date: string | null;
}

export interface ParsedCv {
  person: ParsedCvPerson;
  education: ParsedCvEducation[];
  experience: ParsedCvExperience[];
  projects: ParsedCvProject[];
  skills: ParsedCvSkills;
  certifications: ParsedCvCertification[];
  achievements: string[];
  extractionNote: string; // honest, user-facing caveat about heuristic limits
}

// ---------------------------------------------------------------------------
// Skill keyword lists — extend freely, this is the main lever for recall.
// ---------------------------------------------------------------------------
const SKILL_KEYWORDS: Record<keyof ParsedCvSkills, string[]> = {
  languages: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Golang", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "R", "Dart", "Perl", "Haskell", "Elixir", "MATLAB", "SQL", "Bash", "Shell",
  ],
  frameworks: [
    "React", "Next.js", "Vue", "Nuxt", "Angular", "Svelte", "Django", "Flask", "FastAPI", "Express", "Express.js",
    "Spring", "Spring Boot", ".NET", "ASP.NET", "Node.js", "TensorFlow", "PyTorch", "Keras", "scikit-learn",
    "Pandas", "NumPy", "Rails", "Laravel", "Redux", "GraphQL", "jQuery", "Bootstrap", "Tailwind", "TailwindCSS",
  ],
  tools: [
    "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "Jenkins", "Webpack", "Vite", "Figma", "Jira", "Postman",
    "CI/CD", "Linux", "Nginx", "Terraform", "Ansible", "Grafana", "Prometheus",
  ],
  cloud: ["AWS", "GCP", "Azure", "Vercel", "Heroku", "Firebase", "DigitalOcean", "Cloudflare", "Netlify", "Lambda", "EC2", "S3"],
  databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB", "Cassandra", "Elasticsearch", "MariaDB", "Oracle", "Firestore"],
  other: ["REST", "REST API", "Microservices", "Agile", "Scrum", "TDD", "OAuth", "WebSockets", "gRPC"],
};

const SECTION_HEADER_PATTERNS: Record<string, RegExp> = {
  education: /^(education|academic background)$/i,
  experience: /^(experience|work experience|professional experience|employment( history)?)$/i,
  projects: /^(projects|personal projects|selected projects)$/i,
  skills: /^(skills|technical skills|skills\s*&\s*tools)$/i,
  certifications: /^(certifications?|licenses?( & certifications?)?)$/i,
  achievements: /^(achievements|awards|honors( & awards)?)$/i,
};

const DATE_RANGE_RE = /((?:19|20)\d{2}|present|current)\s*[-–—to]{1,4}\s*((?:19|20)\d{2}|present|current)/i;
const YEAR_RE = /(19|20)\d{2}/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z.]{2,}/i;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const URL_RE = /(https?:\/\/[^\s,)]+|(?:www\.)?[\w-]+\.(?:com|dev|io|me|app|co|net|org|in|xyz|tech|dev)(?:\/[^\s,)]*)?)/gi;

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text.split("\n").map((l) => l.trim());
  const sections: Record<string, string[]> = {};
  let current: string | null = null;

  for (const line of lines) {
    if (!line) continue;
    const normalized = line.replace(/[:\-–—]+$/, "").trim();
    const matchedKey = Object.entries(SECTION_HEADER_PATTERNS).find(([, re]) => re.test(normalized))?.[0];
    if (matchedKey && normalized.length < 40) {
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
  // Blank-line-separated blocks; falls back to one block if the source has no blank lines at all
  // (common when a PDF extractor collapses spacing) by grouping every ~3 non-empty lines instead.
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

function extractSkills(fullText: string): ParsedCvSkills {
  const result: ParsedCvSkills = { languages: [], frameworks: [], tools: [], cloud: [], databases: [], other: [] };
  for (const category of Object.keys(SKILL_KEYWORDS) as (keyof ParsedCvSkills)[]) {
    for (const keyword of SKILL_KEYWORDS[category]) {
      const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(fullText) && !result[category].includes(keyword)) result[category].push(keyword);
    }
  }
  return result;
}

function extractPerson(text: string, lines: string[]): ParsedCvPerson {
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);

  // Mask the email out before URL-matching — otherwise a regex like
  // `[\w-]+\.[a-z]{2,}` happily matches "jane.doe" and "email.com" out of
  // "jane.doe@email.com" and misreports them as a portfolio link.
  const textWithoutEmail = emailMatch ? text.replace(emailMatch[0], " ") : text;
  const urls = Array.from(textWithoutEmail.matchAll(URL_RE)).map((m) => m[0]);

  const github = urls.find((u) => /github\.com/i.test(u)) || null;
  const linkedin = urls.find((u) => /linkedin\.com/i.test(u)) || null;
  const portfolio = urls.find((u) => u !== github && u !== linkedin) || null;

  // Name heuristic: first non-empty line that looks like "First Last" (2-4 title-case
  // words, no digits, not an email/url/section header).
  let name: string | null = null;
  for (const line of lines.slice(0, 5)) {
    if (!line || EMAIL_RE.test(line) || URL_RE.test(line) || /\d/.test(line)) continue;
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
      const degreeMatch = joined.match(/\b(bachelor|master|ph\.?d|b\.?tech|m\.?tech|b\.?s\.?c?|m\.?s\.?c?|associate)\b[^,\n]*?(?=\s*(?:19|20)\d{2}|$)/i);
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

function extractExperience(lines: string[]): ParsedCvExperience[] {
  return groupIntoBlocks(lines)
    .map((block) => {
      const header = block[0];
      if (!header) return null;
      const dateMatch = block.join(" ").match(DATE_RANGE_RE);
      let role: string | null = null;
      let company: string | null = null;
      const sep = header.match(/^(.+?)\s*[@|—-]\s*(.+)$/);
      if (sep) {
        [, role, company] = sep;
      } else {
        role = header;
      }
      const description = block.slice(1).join(" ").slice(0, 300) || null;
      return {
        company: company?.trim() || null,
        role: role?.trim() || null,
        dates: dateMatch?.[0]?.trim() || null,
        description,
      };
    })
    .filter((e): e is ParsedCvExperience => e !== null)
    .slice(0, 8);
}

function extractProjects(lines: string[]): ParsedCvProject[] {
  return groupIntoBlocks(lines)
    .map((block) => {
      const name = block[0]?.replace(/[:\-–—]+$/, "").trim();
      if (!name) return null;
      const description = block.slice(1).join(" ").slice(0, 300) || null;
      const technologies = Object.values(extractSkills(block.join(" "))).flat();
      return { name, description, technologies };
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

export function extractCvFields(text: string): ParsedCv {
  const lines = text.split("\n").map((l) => l.trim());
  const sections = splitIntoSections(text);

  return {
    person: extractPerson(text, lines),
    education: extractEducation(sections.education || []),
    experience: extractExperience(sections.experience || []),
    projects: extractProjects(sections.projects || []),
    skills: extractSkills(text),
    certifications: extractCertifications(sections.certifications || []),
    achievements: (sections.achievements || []).filter(Boolean).slice(0, 5),
    extractionNote:
      "Extracted with best-effort pattern matching, not an AI reader — it can miss things on unusually formatted resumes. Nothing here was guessed; anything not clearly found was left blank.",
  };
}
