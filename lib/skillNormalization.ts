// ============================================================================
// SKILL NORMALIZATION — deliberately conservative.
// ============================================================================
// "False positive matching is worse than missing a weak match" (product brief).
// This map only merges pairs that are unambiguously the exact same thing under
// a different spelling/abbreviation. It never merges related-but-distinct
// technologies — React and React Native stay separate, AWS and AWS Lambda stay
// separate, Python and PyTorch stay separate. When in doubt, an entry is left
// OUT of this map rather than risked.
//
// Notably absent on purpose: bare "Go" is never auto-normalized to the Go
// language anywhere in this codebase (see lib/cvParsing.ts's SKILL_KEYWORDS —
// "Go" was deliberately removed from the language keyword list, only "Golang"
// is matched) precisely because "go" is common English and matching it as a
// skill would be a textbook false positive.

const ALIASES: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  "scikit learn": "scikit-learn",
  "scikit-learn": "scikit-learn",
  sklearn: "scikit-learn",
  tf: "TensorFlow",
  tensorflow: "TensorFlow",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  rest: "REST APIs",
  k8s: "Kubernetes",
  kubernetes: "Kubernetes",
  golang: "Go",
  py: "Python",
  python: "Python",
  mongo: "MongoDB",
  mongodb: "MongoDB",
  "c sharp": "C#",
  csharp: "C#",
  "next": "Next.js",
  "nextjs": "Next.js",
  "next.js": "Next.js",
  "vue": "Vue",
  "vuejs": "Vue",
  "vue.js": "Vue",
};

export function normalizeSkill(raw: string): string {
  const key = raw.trim().toLowerCase();
  return ALIASES[key] || raw.trim();
}

/** Normalizes then dedupes case-insensitively, keeping the first-seen casing for anything not in the alias map. */
export function normalizeAndDedupeSkills(skills: string[]): string[] {
  const seen = new Map<string, string>(); // lowercase key -> canonical display value
  for (const raw of skills) {
    const normalized = normalizeSkill(raw);
    const key = normalized.toLowerCase();
    if (!seen.has(key)) seen.set(key, normalized);
  }
  return Array.from(seen.values());
}
