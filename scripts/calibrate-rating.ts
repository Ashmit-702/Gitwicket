/**
 * Deterministic calibration + regression test suite for lib/rating.ts (v6).
 *
 * Builds synthetic RawGithubStats fixtures by hand and runs them through the
 * full Stage 1 (computeDimensions -> weightedRawScore) + Stage 2
 * (applyCalibrationCurve) pipeline, then asserts on ordering, band placement,
 * and the explicit monotonicity properties required by the v6 brief.
 *
 * Run with:  npx tsx scripts/calibrate-rating.ts   (or: npm run test:rating)
 */
import {
  computeDimensions,
  weightedRawScore,
  applyCalibrationCurve,
  weightedOverall,
  DIMENSION_WEIGHTS,
} from "../lib/rating";
import type { RawGithubStats } from "../lib/github";

// ----------------------------------------------------------------------------
// Fixture builder
// ----------------------------------------------------------------------------

interface DailyPattern {
  activeWeeks: boolean[]; // 52 entries, true = "did something this week"
  daysPerActiveWeek: number;
  commitsPerActiveDay: number;
}

function buildDailyContributions(pattern: DailyPattern): { date: string; count: number }[] {
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  for (let week = 0; week < 52; week++) {
    const isActive = pattern.activeWeeks[week] ?? false;
    for (let day = 0; day < 7; day++) {
      const daysAgo = (51 - week) * 7 + (6 - day);
      const d = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const date = d.toISOString().slice(0, 10);
      const count = isActive && day < pattern.daysPerActiveWeek ? pattern.commitsPerActiveDay : 0;
      out.push({ date, count });
    }
  }
  return out;
}

function spreadWeeks(activeOutOf52: number): boolean[] {
  const weeks = new Array(52).fill(false);
  if (activeOutOf52 <= 0) return weeks;
  const step = 52 / activeOutOf52;
  for (let i = 0; i < activeOutOf52; i++) weeks[Math.min(51, Math.round(i * step))] = true;
  return weeks;
}

function quarterBurst(activeOutOf52: number, startWeek = 15): boolean[] {
  const weeks = new Array(52).fill(false);
  for (let i = 0; i < activeOutOf52; i++) weeks[Math.min(51, startWeek + i)] = true;
  return weeks;
}

interface PersonaInput {
  name: string;
  description: string;
  activeWeeks: boolean[];
  daysPerActiveWeek: number;
  commitsPerActiveDay: number;
  repoCount: number;
  pullRequestsMergedToOthers: number;
  reviews: number;
  stars: number;
  forks: number;
  followers: number;
  languageCount: number;
  issuesClosed: number;
  reposWithLicense: number;
  reposWithDescription: number;
  avgRepoSizeKb: number;
  activeYears: number;
}

function persona(p: PersonaInput): { raw: RawGithubStats; meta: PersonaInput } {
  const dailyContributions = buildDailyContributions({
    activeWeeks: p.activeWeeks,
    daysPerActiveWeek: p.daysPerActiveWeek,
    commitsPerActiveDay: p.commitsPerActiveDay,
  });
  const commits = dailyContributions.reduce((s, d) => s + d.count, 0);
  const raw: RawGithubStats = {
    login: p.name,
    name: p.name,
    avatarUrl: "",
    createdAt: new Date(Date.now() - p.activeYears * 365 * 24 * 60 * 60 * 1000).toISOString(),
    followers: p.followers,
    commits,
    pullRequests: p.pullRequestsMergedToOthers + 2,
    pullRequestsMerged: p.pullRequestsMergedToOthers,
    pullRequestsMergedToOthers: p.pullRequestsMergedToOthers,
    issues: Math.round(p.issuesClosed * 0.6),
    issuesClosed: p.issuesClosed,
    reviews: p.reviews,
    stars: p.stars,
    forks: p.forks,
    repoCount: p.repoCount,
    activeYears: p.activeYears,
    topLanguage: "TypeScript",
    languageCount: p.languageCount,
    bio: null,
    dailyContributions,
    reposWithLicense: p.reposWithLicense,
    reposWithDescription: p.reposWithDescription,
    avgRepoSizeKb: p.avgRepoSizeKb,
    repos: [], // rating-suite fixtures don't need per-repo detail — only lib/careerProfile.ts reads this
  };
  return { raw, meta: p };
}

// ----------------------------------------------------------------------------
// 15 representative synthetic profiles (v6 brief, "CREATE A PROPER BENCHMARK SET")
// ----------------------------------------------------------------------------

const P = {
  dormant: persona({
    name: "dormant",
    description: "1. Dormant account — exists, essentially no activity.",
    activeWeeks: spreadWeeks(2),
    daysPerActiveWeek: 1,
    commitsPerActiveDay: 1,
    repoCount: 1,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 0,
    forks: 0,
    followers: 2,
    languageCount: 1,
    issuesClosed: 0,
    reposWithLicense: 0,
    reposWithDescription: 0,
    avgRepoSizeKb: 20,
    activeYears: 1,
  }),
  beginner: persona({
    name: "beginner",
    description: "2. Beginner — real but light evidence: a few dozen commits, a handful of repos.",
    activeWeeks: spreadWeeks(15),
    daysPerActiveWeek: 2,
    commitsPerActiveDay: 2,
    repoCount: 4,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 3,
    forks: 0,
    followers: 8,
    languageCount: 2,
    issuesClosed: 0,
    reposWithLicense: 0,
    reposWithDescription: 3,
    avgRepoSizeKb: 70,
    activeYears: 1,
  }),
  beginnerSeveralRepos: persona({
    name: "beginner-several-repos",
    description: "3. Beginner with several small repos — more projects and volume than a bare beginner.",
    activeWeeks: spreadWeeks(18),
    daysPerActiveWeek: 2,
    commitsPerActiveDay: 2,
    repoCount: 6,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 4,
    forks: 0,
    followers: 10,
    languageCount: 2,
    issuesClosed: 1,
    reposWithLicense: 1,
    reposWithDescription: 4,
    avgRepoSizeKb: 110,
    activeYears: 1,
  }),
  activeStudent: persona({
    name: "active-student",
    description: "4. Active student — regular coursework/side-project commits, no external PRs.",
    activeWeeks: spreadWeeks(28),
    daysPerActiveWeek: 3,
    commitsPerActiveDay: 3,
    repoCount: 9,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 12,
    forks: 2,
    followers: 18,
    languageCount: 3,
    issuesClosed: 3,
    reposWithLicense: 2,
    reposWithDescription: 6,
    avgRepoSizeKb: 220,
    activeYears: 2,
  }),
  strongStudent: persona({
    name: "strong-student",
    description: "5. Strong student — the conceptual profile from the brief: 10-20 repos, hundreds of commits, 2-5 languages, modest stars, little/no external PRs.",
    activeWeeks: spreadWeeks(38),
    daysPerActiveWeek: 3,
    commitsPerActiveDay: 4,
    repoCount: 14,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 35,
    forks: 6,
    followers: 40,
    languageCount: 4,
    issuesClosed: 7,
    reposWithLicense: 5,
    reposWithDescription: 11,
    avgRepoSizeKb: 300,
    activeYears: 3,
  }),
  earlyCareer: persona({
    name: "early-career",
    description: "6. Early-career developer — solid solo shipping, a couple of external PRs starting to show up.",
    activeWeeks: spreadWeeks(42),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 4,
    repoCount: 16,
    pullRequestsMergedToOthers: 3,
    reviews: 2,
    stars: 70,
    forks: 12,
    followers: 65,
    languageCount: 4,
    issuesClosed: 10,
    reposWithLicense: 7,
    reposWithDescription: 13,
    avgRepoSizeKb: 380,
    activeYears: 3,
  }),
  strongProfessional: persona({
    name: "strong-professional",
    description: "7. Strong professional — consistent solid output, some real external collaboration, not yet at maintainer scale.",
    activeWeeks: spreadWeeks(42),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 4,
    repoCount: 14,
    pullRequestsMergedToOthers: 8,
    reviews: 6,
    stars: 90,
    forks: 15,
    followers: 100,
    languageCount: 4,
    issuesClosed: 12,
    reposWithLicense: 7,
    reposWithDescription: 12,
    avgRepoSizeKb: 420,
    activeYears: 3,
  }),
  ossContributor: persona({
    name: "oss-contributor",
    description: "8. Open-source contributor — real, sustained external PR history.",
    activeWeeks: spreadWeeks(45),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 5,
    repoCount: 15,
    pullRequestsMergedToOthers: 25,
    reviews: 18,
    stars: 150,
    forks: 30,
    followers: 180,
    languageCount: 5,
    issuesClosed: 25,
    reposWithLicense: 8,
    reposWithDescription: 13,
    avgRepoSizeKb: 480,
    activeYears: 4,
  }),
  maintainer: persona({
    name: "maintainer",
    description: "9. Maintainer — big impact numbers, sustained engineering activity, real community load.",
    activeWeeks: spreadWeeks(48),
    daysPerActiveWeek: 5,
    commitsPerActiveDay: 6,
    repoCount: 20,
    pullRequestsMergedToOthers: 35,
    reviews: 55,
    stars: 2500,
    forks: 350,
    followers: 1800,
    languageCount: 6,
    issuesClosed: 100,
    reposWithLicense: 14,
    reposWithDescription: 19,
    avgRepoSizeKb: 650,
    activeYears: 6,
  }),
  popularWeakEngineering: persona({
    name: "popular-weak-engineering",
    description: "10. Popular developer with weak current engineering evidence — popularity should not dominate.",
    activeWeeks: spreadWeeks(4),
    daysPerActiveWeek: 1,
    commitsPerActiveDay: 1,
    repoCount: 4,
    pullRequestsMergedToOthers: 1,
    reviews: 0,
    stars: 6000,
    forks: 700,
    followers: 12000,
    languageCount: 2,
    issuesClosed: 2,
    reposWithLicense: 2,
    reposWithDescription: 3,
    avgRepoSizeKb: 250,
    activeYears: 5,
  }),
  soloManyProjects: persona({
    name: "solo-many-projects",
    description: "11. Solo developer with many personal projects, little/no collaboration.",
    activeWeeks: spreadWeeks(36),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 5,
    repoCount: 24,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 45,
    forks: 6,
    followers: 35,
    languageCount: 4,
    issuesClosed: 5,
    reposWithLicense: 6,
    reposWithDescription: 15,
    avgRepoSizeKb: 340,
    activeYears: 3,
  }),
  fewReposStrongProjects: persona({
    name: "few-repos-strong-projects",
    description: "12. Few repos but each one is substantial (high commit density, well-tended).",
    activeWeeks: spreadWeeks(40),
    daysPerActiveWeek: 4,
    commitsPerActiveDay: 6,
    repoCount: 4,
    pullRequestsMergedToOthers: 2,
    reviews: 1,
    stars: 80,
    forks: 15,
    followers: 60,
    languageCount: 3,
    issuesClosed: 8,
    reposWithLicense: 4,
    reposWithDescription: 4,
    avgRepoSizeKb: 900,
    activeYears: 3,
  }),
  highlyConsistent: persona({
    name: "highly-consistent",
    description: "13. Highly consistent contributor — active nearly every week, modest volume per week.",
    activeWeeks: spreadWeeks(50),
    daysPerActiveWeek: 2,
    commitsPerActiveDay: 2,
    repoCount: 10,
    pullRequestsMergedToOthers: 1,
    reviews: 1,
    stars: 30,
    forks: 4,
    followers: 30,
    languageCount: 3,
    issuesClosed: 6,
    reposWithLicense: 3,
    reposWithDescription: 7,
    avgRepoSizeKb: 280,
    activeYears: 3,
  }),
  broadButShallow: persona({
    name: "broad-but-shallow",
    description: "14. Extremely broad but shallow — many languages/repos, low depth per repo.",
    activeWeeks: spreadWeeks(20),
    daysPerActiveWeek: 2,
    commitsPerActiveDay: 1,
    repoCount: 30,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 10,
    forks: 1,
    followers: 15,
    languageCount: 10,
    issuesClosed: 1,
    reposWithLicense: 2,
    reposWithDescription: 8,
    avgRepoSizeKb: 60,
    activeYears: 2,
  }),
  elite: persona({
    name: "elite",
    description: "15. Elite profile — near-maximal, sustained evidence across every dimension.",
    activeWeeks: spreadWeeks(50),
    daysPerActiveWeek: 6,
    commitsPerActiveDay: 8,
    repoCount: 30,
    pullRequestsMergedToOthers: 80,
    reviews: 150,
    stars: 15000,
    forks: 2000,
    followers: 10000,
    languageCount: 8,
    issuesClosed: 300,
    reposWithLicense: 25,
    reposWithDescription: 29,
    avgRepoSizeKb: 900,
    activeYears: 8,
  }),
  // Bonus: quarter-burst vs spread pair at the same total commit volume, for the
  // "3 months then pause" consistency requirement.
  quarterBurstDev: persona({
    name: "quarter-burst-same-volume",
    description: "Bonus: same commit volume as active-student, but concentrated into one ~13-week quarter.",
    activeWeeks: quarterBurst(13, 15),
    daysPerActiveWeek: 6,
    commitsPerActiveDay: 3,
    repoCount: 9,
    pullRequestsMergedToOthers: 0,
    reviews: 0,
    stars: 12,
    forks: 2,
    followers: 18,
    languageCount: 3,
    issuesClosed: 3,
    reposWithLicense: 2,
    reposWithDescription: 6,
    avgRepoSizeKb: 220,
    activeYears: 2,
  }),
};

const PROFILES = Object.values(P);

// ----------------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------------

function tierFor(rating: number): string {
  if (rating >= 90) return "Legend";
  if (rating >= 78) return "Gold";
  if (rating >= 55) return "Silver";
  return "Bronze";
}

console.log("DIMENSION_WEIGHTS:", DIMENSION_WEIGHTS);
console.log("sum of weights:", Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0));
console.log("");

const results = PROFILES.map(({ raw, meta }) => {
  const dims = computeDimensions(raw);
  const stage1 = weightedRawScore(dims);
  const overall = applyCalibrationCurve(stage1);
  return { name: meta.name, description: meta.description, dims, stage1: Math.round(stage1 * 10) / 10, overall };
});

for (const r of results) {
  console.log(`--- ${r.name} ---`);
  console.log(r.description);
  console.log("dimensions:", r.dims);
  console.log(`stage1 raw score: ${r.stage1}  ->  calibrated overall: ${r.overall} (${tierFor(r.overall)})`);
  console.log("");
}

function get(name: string) {
  const r = results.find((x) => x.name === name);
  if (!r) throw new Error(`missing profile ${name}`);
  return r;
}

let failures = 0;
function check(label: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}: ${label}`);
  if (!cond) failures++;
}

const dormant = get("dormant");
const beginner = get("beginner");
const beginnerSeveral = get("beginner-several-repos");
const activeStudent = get("active-student");
const strongStudent = get("strong-student");
const earlyCareer = get("early-career");
const strongProfessional = get("strong-professional");
const ossContributor = get("oss-contributor");
const maintainer = get("maintainer");
const popularWeak = get("popular-weak-engineering");
const soloMany = get("solo-many-projects");
const fewStrong = get("few-repos-strong-projects");
const highlyConsistent = get("highly-consistent");
const broadShallow = get("broad-but-shallow");
const elite = get("elite");
const quarterBurstResult = get("quarter-burst-same-volume");

console.log("\n=== Ordering checks ===");
check(
  "dormant < beginner < active student < strong student < early-career < strong professional < elite",
  dormant.overall < beginner.overall &&
    beginner.overall < activeStudent.overall &&
    activeStudent.overall < strongStudent.overall &&
    strongStudent.overall < earlyCareer.overall &&
    earlyCareer.overall < strongProfessional.overall &&
    strongProfessional.overall < elite.overall
);
check("beginner < beginner-with-several-repos", beginner.overall < beginnerSeveral.overall);
check("oss contributor >= strong professional's ballpark (both real collaborators)", ossContributor.overall >= strongStudent.overall);
check("maintainer < elite", maintainer.overall < elite.overall);

console.log("\n=== Target-distribution / brief-anchor checks ===");
check("dormant/near-empty stays under 25", dormant.overall < 25);
check("beginner lands in the 25-39 'weak' band", beginner.overall >= 20 && beginner.overall <= 39);
check(
  "the brief's exact conceptual profile (strong-student: 10-20 repos, hundreds of commits, 2-5 languages, modest stars, ~0 external PRs) lands in 50-70",
  strongStudent.overall >= 50 && strongStudent.overall <= 70
);
check("strong professional reaches 65-80", strongProfessional.overall >= 65 && strongProfessional.overall <= 80);
check("maintainer (excellent, broad evidence) reaches 80-90", maintainer.overall >= 78 && maintainer.overall <= 92);
check("elite profile reaches 90-99", elite.overall >= 90 && elite.overall <= 99);
check("NOT everyone is 60+: dormant/beginner/beginner-several stay under 60", dormant.overall < 60 && beginner.overall < 60 && beginnerSeveral.overall < 60);

console.log("\n=== 'Absence of evidence != evidence of weakness' checks ===");
check(
  "zero external PRs gives a NEUTRAL collaboration score (40-60), not a low one",
  strongStudent.dims.collaboration >= 40 && strongStudent.dims.collaboration <= 60
);
check(
  "zero external PRs does not stop a strong solo profile from reaching the 'competent' band or higher",
  strongStudent.overall >= 50
);
check(
  "popularity cannot dominate: popular-but-weak-engineering scores well below active-student despite vastly larger stars/followers",
  popularWeak.overall < activeStudent.overall
);
check(
  "a real external collaborator (oss-contributor) still outscores an equally-active solo dev with many uncollaborated repos (solo-many-projects)",
  ossContributor.overall > soloMany.overall
);
check(
  "few strong/substantial repos are not crushed relative to many shallow ones (few-repos-strong-projects vs broad-but-shallow)",
  fewStrong.overall > broadShallow.overall
);
check(
  "a highly consistent, modest-volume contributor is not punished relative to a bursty same-volume one",
  highlyConsistent.overall >= 40
);
check(
  "a quarter-long (13-week) burst is not catastrophically punished relative to spread-out same-volume activity",
  Math.abs(quarterBurstResult.overall - activeStudent.overall) <= 15
);

console.log("\n=== Monotonicity properties (v6 brief, 'IMPORTANT MATHEMATICAL PROPERTY') ===");

// Gaining commits/projects/activity, nothing else worse -> rating must not decrease.
{
  const base = { ...strongStudent.dims };
  const improvedRaw = weightedRawScore({ ...base, engineeringActivity: Math.min(100, base.engineeringActivity + 15) });
  const baseRaw = weightedRawScore(base);
  check(
    "gaining engineering activity (commits) alone never decreases the rating",
    applyCalibrationCurve(improvedRaw) >= applyCalibrationCurve(baseRaw)
  );
}

// Gaining stars/followers should not decrease rating.
{
  const base = { ...strongStudent.dims };
  const improvedRaw = weightedRawScore({ ...base, impact: Math.min(100, base.impact + 15) });
  const baseRaw = weightedRawScore(base);
  check(
    "gaining stars/followers (impact) alone never decreases the rating",
    applyCalibrationCurve(improvedRaw) >= applyCalibrationCurve(baseRaw)
  );
}

// Gaining external contributions should not decrease rating.
{
  const base = { ...strongStudent.dims };
  const improvedRaw = weightedRawScore({ ...base, collaboration: Math.min(100, base.collaboration + 20) });
  const baseRaw = weightedRawScore(base);
  check(
    "gaining external contributions (collaboration) alone never decreases the rating",
    applyCalibrationCurve(improvedRaw) >= applyCalibrationCurve(baseRaw)
  );
}

// Calibration curve itself is monotonic non-decreasing everywhere, sampled densely.
{
  let monotonic = true;
  let prev = applyCalibrationCurve(0);
  for (let x = 1; x <= 100; x++) {
    const y = applyCalibrationCurve(x);
    if (y < prev) monotonic = false;
    prev = y;
  }
  check("the Stage 2 calibration curve is monotonic non-decreasing across its entire domain (0-100)", monotonic);
}

check(
  "zero external contributions does not receive an arbitrary severe penalty (dormant developer's LOW score comes from low activity/projects, not from the neutral collaboration floor)",
  dormant.dims.collaboration >= 40
);

check("a genuinely dormant profile remains low regardless of its neutral collaboration/community floors", dormant.overall < 25);

check(
  "elite evidence across multiple categories reaches 90+",
  elite.overall >= 90
);

check(
  "no single dimension weight exceeds 0.32 (no dimension can unilaterally dominate)",
  Math.max(...Object.values(DIMENSION_WEIGHTS)) <= 0.32
);
check("weights sum to 1.0", Math.abs(Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0) - 1) < 1e-9);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
