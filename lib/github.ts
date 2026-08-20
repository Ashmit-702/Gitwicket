export interface RawGithubStats {
  login: string;
  name: string | null;
  avatarUrl: string;
  createdAt: string;
  followers: number;
  commits: number; // recent (last ~12mo) commit contributions
  pullRequests: number; // recent (last ~12mo) PRs opened
  pullRequestsMerged: number; // all-time merged PRs — a truer "wickets taken" signal
  pullRequestsMergedToOthers: number; // merged PRs into repos this user does NOT own — real collaboration signal
  issues: number; // recent (last ~12mo) issues opened
  issuesClosed: number; // all-time closed issues
  reviews: number; // recent (last ~12mo) PR reviews given
  stars: number;
  forks: number;
  repoCount: number;
  activeYears: number; // distinct calendar years with any contribution — real career length
  topLanguage: string | null; // most common primary language across owned, non-fork repos
  languageCount: number; // distinct primary languages across owned, non-fork repos
  bio: string | null; // the profile's own bio text, if any
  dailyContributions: { date: string; count: number }[]; // full trailing-year daily calendar — feeds Form's time windows
  // Project Depth proxies — deliberately weak/gameable signals, kept low-weight downstream.
  reposWithLicense: number;
  reposWithDescription: number;
  avgRepoSizeKb: number;
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    login
    name
    avatarUrl
    createdAt
    bio
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      totalCount
      nodes {
        stargazerCount
        forkCount
        diskUsage
        description
        licenseInfo { key }
        primaryLanguage { name }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionYears
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
    mergedPullRequests: pullRequests(states: MERGED, first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
      totalCount
      nodes { repository { owner { login } } }
    }
    closedIssues: issues(states: CLOSED) { totalCount }
  }
}`;

// Public GitHub REST fallback is rate-limited to 60 req/hr per IP with no token.
// A token (repo-less, public_repo scope not even required for reads) bumps GraphQL to 5000/hr.
// Set GITHUB_TOKEN in your Vercel project's environment variables.
export async function fetchGithubStats(username: string): Promise<RawGithubStats | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set. Add it in your Vercel project environment variables.");
  }

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
    // Cache at the fetch layer too, on top of Redis — cheap insurance.
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const json = await res.json();
  const user = json?.data?.user;
  if (!user) return null;

  const repoNodes: {
    stargazerCount: number;
    forkCount: number;
    diskUsage: number | null;
    description: string | null;
    licenseInfo: { key: string } | null;
    primaryLanguage: { name: string } | null;
  }[] = user.repositories?.nodes ?? [];

  const stars = repoNodes.reduce((sum, r) => sum + r.stargazerCount, 0);
  const forks = repoNodes.reduce((sum, r) => sum + r.forkCount, 0);
  const reposWithLicense = repoNodes.filter((r) => r.licenseInfo?.key && r.licenseInfo.key !== "none").length;
  const reposWithDescription = repoNodes.filter((r) => r.description && r.description.trim().length > 0).length;
  const avgRepoSizeKb =
    repoNodes.length > 0 ? repoNodes.reduce((sum, r) => sum + (r.diskUsage ?? 0), 0) / repoNodes.length : 0;

  const languageCounts = new Map<string, number>();
  for (const r of repoNodes) {
    const lang = r.primaryLanguage?.name;
    if (lang) languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
  }
  let topLanguage: string | null = null;
  let topCount = 0;
  for (const [lang, count] of languageCounts) {
    if (count > topCount) {
      topLanguage = lang;
      topCount = count;
    }
  }

  const contributionYears: number[] = user.contributionsCollection?.contributionYears ?? [];

  const mergedPrNodes: { repository: { owner: { login: string } } }[] = user.mergedPullRequests?.nodes ?? [];
  // Only counts within the most recent 100 merged PRs (API page cap) — a reasonable sample
  // for the collaboration *ratio*, even if it undercounts absolute totals for extremely
  // prolific accounts. Documented limitation, not a silent inaccuracy.
  const pullRequestsMergedToOthers = mergedPrNodes.filter(
    (pr) => pr.repository?.owner?.login && pr.repository.owner.login.toLowerCase() !== username.toLowerCase()
  ).length;

  const weeks: { contributionDays: { date: string; contributionCount: number }[] }[] =
    user.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const dailyContributions = weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  );

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    commits: user.contributionsCollection.totalCommitContributions,
    pullRequests: user.contributionsCollection.totalPullRequestContributions,
    pullRequestsMerged: user.mergedPullRequests?.totalCount ?? 0,
    pullRequestsMergedToOthers,
    issues: user.contributionsCollection.totalIssueContributions,
    issuesClosed: user.closedIssues?.totalCount ?? 0,
    reviews: user.contributionsCollection.totalPullRequestReviewContributions,
    stars,
    forks,
    repoCount: user.repositories?.totalCount ?? 0,
    activeYears: Math.max(1, contributionYears.length),
    topLanguage,
    languageCount: languageCounts.size,
    bio: user.bio || null,
    dailyContributions,
    reposWithLicense,
    reposWithDescription,
    avgRepoSizeKb,
  };
}
