export const dynamic = "force-static";

const GITHUB_ROWS = [
  {
    stat: "Strike rate (STR)",
    copy: "Recent commit volume, last 12 months. More commits, higher strike rate — like a batsman scoring quickly.",
  },
  {
    stat: "Batting average (AVG)",
    copy: "Commits, merged pull requests, and reviews, averaged across your active years — years you actually contributed, not just years the account has existed. A dormant old account isn't penalized for calendar time it wasn't active.",
  },
  {
    stat: "Wickets (WKT)",
    copy: "Merged pull requests plus code reviews given. Shipped work counts, not just opened PRs.",
  },
  {
    stat: "Economy (ECO)",
    copy: "Stars and followers, scaled logarithmically. Lower economy (like real cricket) means tighter, more efficient impact per repo.",
  },
  {
    stat: "Boundaries (BND)",
    copy: "Total stars across your owned, non-fork repos.",
  },
  {
    stat: "Catches (CAT)",
    copy: "Code reviews given in the last 12 months — helping other people's work land safely.",
  },
];

const LEETCODE_ROWS = [
  {
    stat: "Strike rate (STR)",
    copy: "Solving pace — Easy, Medium, and Hard problems solved, weighted by difficulty and spread across your active years.",
  },
  {
    stat: "Batting average (AVG)",
    copy: "Total problems solved, averaged across your active years.",
  },
  {
    stat: "Wickets (WKT)",
    copy: "Hard problems solved, all-time. The tough dismissals.",
  },
  {
    stat: "Economy (ECO)",
    copy: "Acceptance rate — accepted submissions vs. total attempts. Fewer wasted submissions means a tighter economy.",
  },
  {
    stat: "Boundaries (BND)",
    copy: "Medium problems solved, all-time.",
  },
  {
    stat: "Catches (CAT)",
    copy: "Rated contests entered — showing up when it's live.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mow-lines min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <a href="/" className="font-display text-xs uppercase tracking-widest text-bail">
          ← GitWicket
        </a>

        <h1 className="mt-6 font-display text-3xl font-black uppercase italic text-chalk">How it's rated</h1>
        <p className="mt-4 font-body text-sm leading-relaxed text-chalk/70">
          Every card is generated from your public GitHub or LeetCode activity — nothing manual, nothing
          subjective. Here's exactly what feeds each stat, for both platforms.
        </p>

        <div className="mt-10">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-bail">GitHub</p>
          <div className="mt-4 space-y-6">
            {GITHUB_ROWS.map((row) => (
              <div key={row.stat} className="border-l-2 border-bail/40 pl-4">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-bail">{row.stat}</p>
                <p className="mt-1 font-body text-sm text-chalk/60">{row.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-chalk/10 pt-8">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">LeetCode</p>
          <div className="mt-4 space-y-6">
            {LEETCODE_ROWS.map((row) => (
              <div key={row.stat} className="border-l-2 border-[#E2852B]/40 pl-4">
                <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">{row.stat}</p>
                <p className="mt-1 font-body text-sm text-chalk/60">{row.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-bail">Overall rating</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            A weighted blend of all six stats, ranging from 8 to 92. There's no artificial floor — a near-empty
            profile shows a near-empty rating. The 90s ("Legend" tier) are a separate gate on top of that: for
            GitHub, at least 4 active years, 4 account-years, 400+ followers, and 800+ stars; for LeetCode, at
            least 3 active years, a 1900+ contest rating, and 300+ problems solved. One heroic year can't buy
            it — it takes sustained years and real results.
          </p>
        </div>

        <div className="mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-bail">Tiers</p>
          <ul className="mt-2 space-y-1 font-body text-sm text-chalk/60">
            <li>Bronze — below 55</li>
            <li>Silver — 55 to 77</li>
            <li>Gold — 78 to 89</li>
            <li>Legend — 90+ (gated, see above)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
