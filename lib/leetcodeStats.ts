import type { RawLeetCodeStats } from "./leetcode";
import { clamp, curve, toStars, type CricketCardStats, type Role } from "./cricketStats";

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
  const catches = raw.contestsAttended;

  // --- uniform 0-99 sub-scores — same curve function as GitHub, different inputs ---
  const battingScore = battingAverage;
  const strikeScore = curve(strikeRate, 75);
  const wicketScore = curve(wickets, 15);
  const economyScore = curve(10 - economy, 4);
  const boundaryScore = curve(boundaries, 40);
  const catchScore = curve(catches, 8);

  const rawOverall =
    battingScore * 0.25 +
    strikeScore * 0.2 +
    wicketScore * 0.2 +
    economyScore * 0.15 +
    boundaryScore * 0.12 +
    catchScore * 0.08;

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
    { label: "Strike rate", abbr: "STR", value: strikeScore },
    { label: "Batting avg", abbr: "AVG", value: battingScore },
    { label: "Wickets", abbr: "WKT", value: wicketScore },
    { label: "Economy", abbr: "ECO", value: economyScore },
    { label: "Boundaries", abbr: "BND", value: boundaryScore },
    { label: "Catches", abbr: "CAT", value: catchScore },
  ];

  const scoutingMetrics = [
    {
      label: "Problems solved",
      raw: raw.totalSolved,
      suffix: "solved all-time",
      score: strikeScore,
      explanation: "Total problems cracked — feeds Strike Rate.",
    },
    {
      label: "Hard problems",
      raw: raw.hardSolved,
      suffix: "hard, all-time",
      score: wicketScore,
      explanation: "The toughest dismissals on the sheet — feeds Wickets.",
    },
    {
      label: "Acceptance rate",
      raw: Math.round(acceptanceRate),
      suffix: "% accepted",
      score: economyScore,
      explanation: "Clean submissions vs. wasted attempts — feeds Economy.",
    },
    {
      label: "Medium problems",
      raw: raw.mediumSolved,
      suffix: "medium, all-time",
      score: boundaryScore,
      explanation: "Solid, reliable returns — feeds Boundaries.",
    },
    {
      label: "Contests entered",
      raw: raw.contestsAttended,
      suffix: "rated contests",
      score: catchScore,
      explanation: "Showing up when it's live — feeds Catches.",
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
    { label: "Consistency", stars: toStars(battingScore) },
    { label: "Power hitting", stars: toStars(boundaryScore) },
    { label: "Control", stars: toStars(economyScore) },
    { label: "Support play", stars: toStars(catchScore) },
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
    ["Consistent run-scorer", battingScore],
    ["Explosive striker", strikeScore],
    ["Wicket-taking menace", wicketScore],
    ["Economical operator", economyScore],
    ["Big-hitting star", boundaryScore],
    ["Safe pair of hands", catchScore],
  ];
  scored.sort((a, b) => b[1] - a[1]);
  const signatureStat = scored[0][1] > 0 ? scored[0][0] : "Still finding their game";

  return {
    login: raw.username,
    name: raw.realName || raw.username,
    avatarUrl: raw.avatarUrl,
    platform: "leetcode",
    role,
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
  };
}
