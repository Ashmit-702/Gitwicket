import type { RawLeetCodeStats } from "./leetcode";
import { clamp, curve, shapeScores, toStars, type CricketCardStats, type Role } from "./cricketStats";

export function mapToLeetCodeCricketStats(raw: RawLeetCodeStats): CricketCardStats {
  const activeYears = raw.activeYears;
  // LeetCode's public API doesn't expose account-creation date, so career length is
  // approximated from active years rather than a real join date.
  const accountAgeYears = Math.max(activeYears, 0.5);

  // --- literal, human-readable numbers (used in the scouting panel + page copy) ---
  const strikeRate = clamp(
    Math.round((raw.easySolved + raw.mediumSolved * 1.5 + raw.hardSolved * 2) / activeYears),
    0,
    300
  );
  const battingAverage = clamp(Math.round(raw.totalSolved / activeYears / 3), 0, 99);
  const wickets = raw.hardSolved;
  const acceptanceRate = raw.totalSubmissions > 0 ? (raw.acceptedSubmissions / raw.totalSubmissions) * 100 : 0;
  const economy = clamp(Number((10 - (acceptanceRate / 100) * 8).toFixed(1)), 2, 10);
  const boundaries = raw.mediumSolved;
  const catches = raw.contestsAttended + Math.round(raw.totalSolved / 150);

  // --- uniform 0-99 sub-scores — same curve function as GitHub, different inputs ---
  // Midpoints below are calibrated against rough real-world personas (a few months in,
  // a steady 1-2yr grinder, a 2-3yr interview-prep grinder, a competitive solver, an
  // elite/NeetCode-tier account) so a typical profile doesn't saturate a stat at ~95+
  // from a fairly modest count — that was the earlier bug making ratings feel arbitrary.
  const battingScore = battingAverage;
  const strikeScore = curve(strikeRate, 220);
  const wicketScore = curve(wickets, 90);
  const economyScore = curve(10 - economy, 5.5);
  const boundaryScore = curve(boundaries, 180);
  const catchScore = curve(catches, 10);

  // Shape the six absolute scores against each other — see shapeScores doc comment in
  // cricketStats.ts. This is what actually appears on the card face and drives the rating.
  const [battingHyb, strikeHyb, wicketHyb, economyHyb, boundaryHyb, catchHyb] = shapeScores([
    battingScore,
    strikeScore,
    wicketScore,
    economyScore,
    boundaryScore,
    catchScore,
  ]);

  const rawOverall =
    battingHyb * 0.25 +
    strikeHyb * 0.2 +
    wicketHyb * 0.2 +
    economyHyb * 0.15 +
    boundaryHyb * 0.12 +
    catchHyb * 0.08;

  let rating = clamp(Math.round(rawOverall), 8, 92);

  const isLegendEligible =
    activeYears >= 3 && raw.contestRating >= 1900 && raw.totalSolved >= 300 && rating >= 78;
  if (isLegendEligible) rating = clamp(rating + 9, 8, 99);

  const tier = rating >= 90 ? "Legend" : rating >= 78 ? "Gold" : rating >= 55 ? "Silver" : "Bronze";

  const totalSolved = Math.max(1, raw.totalSolved);
  const hardShare = raw.hardSolved / totalSolved;
  const easyShare = raw.easySolved / totalSolved;
  let role: Role = "Batsman";
  if (hardShare > 0.22) role = "Bowler";
  else if (raw.contestsAttended >= 8 && raw.contestRating >= 1500) role = "All-rounder";
  else if (easyShare > 0.55 && raw.streak >= 10) role = "Wicketkeeper";

  const cardStats = [
    { label: "Strike rate", abbr: "STR", value: strikeHyb },
    { label: "Batting avg", abbr: "AVG", value: battingHyb },
    { label: "Wickets", abbr: "WKT", value: wicketHyb },
    { label: "Economy", abbr: "ECO", value: economyHyb },
    { label: "Boundaries", abbr: "BND", value: boundaryHyb },
    { label: "Catches", abbr: "CAT", value: catchHyb },
  ];

  const scoutingMetrics = [
    {
      label: "Problems solved",
      raw: raw.totalSolved,
      suffix: "solved all-time",
      score: strikeHyb,
      explanation: "Total problems cracked, weighed against your other five stats — feeds Strike Rate.",
    },
    {
      label: "Hard problems",
      raw: raw.hardSolved,
      suffix: "hard, all-time",
      score: wicketHyb,
      explanation: "The toughest dismissals on the sheet, weighed against your other five stats — feeds Wickets.",
    },
    {
      label: "Acceptance rate",
      raw: Math.round(acceptanceRate),
      suffix: "% accepted",
      score: economyHyb,
      explanation: "Clean submissions vs. wasted attempts — feeds Economy.",
    },
    {
      label: "Medium problems",
      raw: raw.mediumSolved,
      suffix: "medium, all-time",
      score: boundaryHyb,
      explanation: "Solid, reliable returns — feeds Boundaries.",
    },
    {
      label: "Contests entered",
      raw: raw.contestsAttended,
      suffix: "rated contests",
      score: catchHyb,
      explanation: "Showing up when it's live, plus overall volume solved — feeds Catches, so grinders who skip contests aren't zeroed out.",
    },
    {
      label: "Contest rating",
      raw: raw.contestRating,
      suffix: "rating",
      score: curve(raw.contestRating, 1200),
      explanation: "Head-to-head competitive strength.",
    },
    {
      label: "Active years",
      raw: activeYears,
      suffix: activeYears === 1 ? "year with activity" : "years with activity",
      score: curve(activeYears, 4),
      explanation: "Distinct years you've actually been solving — powers Batting Average and the Legend gate.",
    },
  ];

  const attributes = [
    { label: "Consistency", stars: toStars(battingHyb) },
    { label: "Power hitting", stars: toStars(boundaryHyb) },
    { label: "Control", stars: toStars(economyHyb) },
    { label: "Support play", stars: toStars(catchHyb) },
    { label: "Longevity", stars: toStars(curve(activeYears, 4)) },
  ];

  const playstyles: string[] = [];
  if (battingAverage >= 70) playstyles.push("Century Maker");
  if (wickets >= 30) playstyles.push("Death Bowler");
  if (catches >= 15) playstyles.push("Safe Hands");
  if (activeYears >= 5) playstyles.push("Marathoner");
  if (strikeRate >= 150) playstyles.push("Rapid Fire");
  if (boundaries >= 100) playstyles.push("Crowd Puller");
  if (raw.ranking > 0 && raw.ranking <= 10000) playstyles.push("Franchise Player");
  if (playstyles.length === 0) playstyles.push("Rising Talent");

  const scored: [string, number][] = [
    ["Consistent run-scorer", battingHyb],
    ["Explosive striker", strikeHyb],
    ["Wicket-taking menace", wicketHyb],
    ["Economical operator", economyHyb],
    ["Big-hitting star", boundaryHyb],
    ["Safe pair of hands", catchHyb],
  ];
  scored.sort((a, b) => b[1] - a[1]);
  const signatureStat = scored[0][1] > 0 ? scored[0][0] : "Still finding their game";

  let taglineTag = "RISING TALENT";
  let tagline = "Still finding rhythm at the crease — but building fast.";
  if (tier === "Legend") {
    taglineTag = "HALL OF FAME";
    tagline = "A generational talent: high and balanced, earned over years.";
  } else if (role === "Wicketkeeper") {
    taglineTag = "SAFE HANDS";
    tagline = "Solves relentlessly, day after day — the streak speaks for itself.";
  } else if (role === "Bowler") {
    taglineTag = "SILENT KILLER";
    tagline = "Racks up Hard problems while everyone else is still on Easy.";
  } else if (role === "All-rounder") {
    taglineTag = "ONE TO WATCH";
    tagline = "Solves fast and competes live — a genuine contest threat.";
  } else if (tier === "Gold") {
    taglineTag = "MATCH WINNER";
    tagline = "The kind of solver who single-handedly turns a contest.";
  } else if (tier === "Silver") {
    taglineTag = "STEADY HAND";
    tagline = "Reliable and consistent, submission after submission.";
  }

  return {
    login: raw.username,
    name: raw.realName || raw.username,
    avatarUrl: raw.avatarUrl,
    platform: "leetcode",
    role,
    taglineTag,
    tagline,
    tier,
    rating,
    strikeRate,
    battingAverage,
    wickets,
    economy,
    boundaries,
    catches,
    cardStats,
    scoutingMetrics,
    attributes,
    playstyles,
    accountAgeYears: Math.round(accountAgeYears * 10) / 10,
    activeYears,
    signatureStat,
    repos: [], // LeetCode cards have no GitHub repo data — Career Proof gracefully shows "Not enough data" for these
  };
}
