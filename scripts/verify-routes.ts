// Guards against the "another route's content ended up at /" regression.
// Run: npm run verify:routes   (also part of `npm run verify`)
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

const fail: string[] = [];
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const hash = (p: string) => createHash("sha256").update(read(p)).digest("hex");

// 1. `/` must be the homepage.
const home = read("app/page.tsx");
if (!/export default function HomePage\b/.test(home)) fail.push("app/page.tsx does not export HomePage");
if (/HowItWorks|ComparePage/.test(home)) fail.push("app/page.tsx references another route's component");
if (!/Get My Card/.test(home)) fail.push("app/page.tsx is missing the GitHub 'Get My Card' CTA");
if (!/build-career-card/.test(home)) fail.push("app/page.tsx is missing the Career Card CTA");

// 2. No two route pages may be byte-identical.
const pages: string[] = [];
(function walk(d: string) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/^page\.tsx$/.test(f)) pages.push(p);
  }
})("app");
const seen = new Map<string, string>();
for (const p of pages) {
  const h = hash(p);
  if (seen.has(h)) fail.push(`duplicate route content: ${seen.get(h)} === ${p}`);
  seen.set(h, p);
}

// 3. Nothing else may own "/".
for (const f of ["middleware.ts", "middleware.js", "src/middleware.ts"]) if (existsSync(f)) fail.push(`${f} exists — review it for redirects on /`);
if (/rewrites|redirects/.test(read("next.config.js"))) fail.push("next.config.js defines rewrites/redirects — review them for '/'");
if (existsSync("app/(home)") || existsSync("app/(marketing)")) fail.push("route group may shadow '/'");

// 4. Canonical domain is centralized.
for (const p of ["app/layout.tsx", "app/robots.ts", "app/sitemap.ts"]) if (/gitwicket\.dev/.test(read(p))) fail.push(`${p} hardcodes gitwicket.dev`);

if (fail.length) { console.error("ROUTE CHECK FAILED:\n - " + fail.join("\n - ")); process.exit(1); }
console.log(`PASS: routes ok (${pages.length} pages, '/' is HomePage, no duplicates, no redirects)`);
