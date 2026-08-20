export const dynamic = "force-static";

const ROWS = [
  {
    stat: "Strike rate (STR)",
    copy: "Commit pace — recent commit contributions (last ~12 months), scaled to a daily rate.",
  },
  {
    stat: "Batting average (AVG)",
    copy: "Commits + 3x merged PRs + 1.5x reviews, averaged across your active years — years you actually had contributions, not just years since you signed up.",
  },
  {
    stat: "Wickets (WKT)",
    copy: "Merged PRs (all-time) + reviews given + a repo-count bonus. Weighted heavily and don't come cheap — a handful of merged PRs won't max this out.",
  },
  {
    stat: "Economy (ECO)",
    copy: "Reach and impact — stars and followers pull this down (in a good way; lower economy is better, same as bowling). Zero stars and zero followers means a wide-open economy.",
  },
  {
    stat: "Boundaries (BND)",
    copy: "Total stars earned across your owned, non-fork repos.",
  },
  {
    stat: "Catches (CAT)",
    copy: "Reviews given, plus closed issues — so maintainers and reviewers get credit, not just people shipping their own code.",
  },
];

export default function HowItWorksGithubPage() {
  return (
    <main className="mow-lines min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <a href="/" className="font-display text-xs uppercase tracking-widest text-[#E2852B]">
            ← GitWicket
          </a>
          <a href="/how-it-works/leetcode" className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail">
            LeetCode version →
          </a>
        </div>

        <h1 className="stagger-row mt-6 font-display text-3xl font-black uppercase italic text-chalk">
          How GitHub gets rated
        </h1>
        <p className="stagger-row mt-4 font-body text-sm leading-relaxed text-chalk/70">
          GitHub cards are pulled from your public profile — commits, merged PRs, reviews, stars, and
          followers. Same six-stat card as LeetCode, different source, and its own tier colors so you can
          tell the two apart at a glance.
        </p>

        <div className="mt-10 space-y-6">
          {ROWS.map((row) => (
            <div key={row.stat} className="stagger-row border-l-2 border-[#E2852B]/40 pl-4">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">{row.stat}</p>
              <p className="mt-1 font-body text-sm text-chalk/60">{row.copy}</p>
            </div>
          ))}
        </div>

        <div className="stagger-row mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">Why your card has a shape</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            Before the six stats above get weighted into your overall rating, each one is read against
            the other five on <em>your own</em> card — so your strongest signal gets pushed up and your
            weakest gets pulled down, and the shape of your card is relative to you, not a fixed bar
            everyone&apos;s measured against. That&apos;s deliberate: two accounts with wildly different
            raw activity can still both read as &quot;well-rounded&quot; if their six numbers are close to
            each other, and a genuinely lopsided profile (huge on commits, nothing anywhere else) will
            show that lean clearly.
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            It&apos;s not the whole story though — each stat keeps a smaller dose of its raw, absolute
            value mixed in underneath the shape (30%, specifically). That&apos;s what stops a genuinely
            empty account from reading as generously as a real, balanced one just because it has &quot;no
            weak points&quot; on paper. Mostly shape, a little grounding.
          </p>
        </div>

        <div className="stagger-row mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">Overall rating</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            A weighted blend of all six stats, ranging from 8 to 92. A small floor keeps a real but modest
            account (a few stars, a handful of reviews) from reading identically to a genuinely empty one —
            but it&apos;s deliberately small, so it doesn&apos;t inflate the overall number. The 90s
            (&quot;Legend&quot; tier) are a separate gate: at least 4 active years, a 4-year-old account,
            400+ followers, and 800+ stars. Volume alone doesn&apos;t get you there without the reach to
            back it up.
          </p>
        </div>

        <div className="stagger-row mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">Tiers</p>
          <ul className="mt-2 space-y-1 font-body text-sm text-chalk/60">
            <li>Bronze — below 55</li>
            <li>Silver — 55 to 77</li>
            <li>Gold — 78 to 89</li>
            <li>Legend — 90+ (gated, see above)</li>
          </ul>
        </div>

        <div className="stagger-row mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">A note on the data</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            &quot;Active years&quot; and every stat above are pulled from GitHub&apos;s GraphQL API using a
            single app-level token — the same thing anyone sees on your public profile when logged out.
            That means commits to private repos (a day job at a company, for example) don&apos;t count
            toward your active years or your batting average, even if you&apos;ve been shipping code there
            for years. If most of your real work happens in private repos, your public-only rating will
            read lower than your actual output — that&apos;s a limit of the public API, not a bug in the
            scoring.
          </p>
        </div>
      </div>
    </main>
  );
}
