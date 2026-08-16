// LeetCode has no official public API, but leetcode.com/graphql serves public profile
// data to anyone (it's what leetcode.com's own frontend calls) — no auth token needed.
// Because it's unofficial, field availability has drifted over time in the community
// tooling that relies on it; this fetch is defensive about missing fields rather than
// assuming the shape below is permanently guaranteed.

export interface RawLeetCodeStats {
  username: string;
  realName: string | null;
  avatarUrl: string;
  ranking: number; // global site ranking — lower is better; 0 if unranked
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  totalSubmissions: number; // "All" totalSubmissionNum — used for acceptance rate
  acceptedSubmissions: number; // "All" acSubmissionNum — used for acceptance rate
  contestRating: number; // 0 if they've never entered a rated contest
  contestsAttended: number;
  activeYears: number; // distinct years with at least one submission
  streak: number; // current daily submission streak
}

const QUERY = `
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      ranking
      userAvatar
    }
    submitStatsGlobal {
      acSubmissionNum { difficulty count }
      totalSubmissionNum { difficulty count }
    }
    userCalendar {
      activeYears
      streak
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
  }
}`;

function pickCount(list: { difficulty: string; count: number }[] | undefined, difficulty: string): number {
  return list?.find((d) => d.difficulty === difficulty)?.count ?? 0;
}

export async function fetchLeetCodeStats(username: string): Promise<RawLeetCodeStats | null> {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent": "Mozilla/5.0 (compatible; GitWicket/1.0; +https://gitwicket.dev)",
    },
    body: JSON.stringify({ query: QUERY, variables: { username } }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const json = await res.json();
  const user = json?.data?.matchedUser;
  if (!user) return null;

  const ac: { difficulty: string; count: number }[] = user.submitStatsGlobal?.acSubmissionNum ?? [];
  const total: { difficulty: string; count: number }[] = user.submitStatsGlobal?.totalSubmissionNum ?? [];
  const activeYears: number[] = user.userCalendar?.activeYears ?? [];
  const contest = json?.data?.userContestRanking;

  return {
    username: user.username,
    realName: user.profile?.realName || null,
    avatarUrl: user.profile?.userAvatar ?? "",
    ranking: user.profile?.ranking ?? 0,
    easySolved: pickCount(ac, "Easy"),
    mediumSolved: pickCount(ac, "Medium"),
    hardSolved: pickCount(ac, "Hard"),
    totalSolved: pickCount(ac, "All"),
    totalSubmissions: pickCount(total, "All"),
    acceptedSubmissions: pickCount(ac, "All"),
    contestRating: Math.round(contest?.rating ?? 0),
    contestsAttended: contest?.attendedContestsCount ?? 0,
    activeYears: Math.max(1, activeYears.length || 1),
    streak: user.userCalendar?.streak ?? 0,
  };
}
