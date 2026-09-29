// Byte-level guard for the frozen rating system.
// Run: npm run verify:rating-frozen
// To intentionally re-baseline (a deliberate rating change), run with --update.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";

const FILES = ["lib/rating.ts", "lib/cricketStats.ts", "lib/leetcodeStats.ts", "lib/github.ts", "lib/leetcode.ts"];
const LOCK = "scripts/rating.lock.json";
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
const current = Object.fromEntries(FILES.map((f) => [f, sha(f)]));

if (process.argv.includes("--update") || !existsSync(LOCK)) { writeFileSync(LOCK, JSON.stringify(current, null, 2) + "\n"); console.log("rating lock written"); process.exit(0); }
const locked = JSON.parse(readFileSync(LOCK, "utf8"));
const bad = FILES.filter((f) => locked[f] !== current[f]);

// Career code must never import the rating engine.
import { readdirSync, statSync } from "fs";
import { join } from "path";
const leaks: string[] = [];
(function walk(d: string) {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f) && /from ["'][^"']*\/(rating|cricketStats)["']/.test(readFileSync(p, "utf8")) && /career|Career/.test(p) && !/import type/.test(readFileSync(p, "utf8").split("\n").filter(l => /\/(rating|cricketStats)["']/.test(l)).join("\n"))) leaks.push(p); }
})("lib");
if (bad.length || leaks.length) { console.error("RATING GUARD FAILED", { changed: bad, careerValueImports: leaks }); process.exit(1); }
console.log("PASS: rating-critical files byte-identical to lock; no career value-imports of rating internals");
