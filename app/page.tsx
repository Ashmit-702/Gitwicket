export const dynamic = "force-static";

const ROWS = [
  {
    stat: "Strike rate (STR)",
    copy: "Commit pace — your Engineering Activity dimension: commits over the last year, with diminishing returns so a huge commit count doesn't linearly outscore a solid one.",
  },
  {
    stat: "Batting average (AVG)",
    copy: "A blend of Engineering Activity and Consistency — sustained volume that's also spread across the year, not just a single hot streak.",
  },
  {
    stat: "Wickets (WKT)",
    copy: "Your Collaboration dimension: PRs merged into repos you don't own, plus reviews given, plus a smaller credit for solid solo-shipped repos. Zero external PRs doesn't zero this out — it just means you're scored mostly on the solo-building baseline until you've collaborated elsewhere.",
  },
  {
    stat: "Economy (ECO)",
    copy: "Your Project Depth dimension — a deliberately weak, low-weight proxy (license, description, repo size). It's a minor signal on purpose: GitHub's public API can't actually measure code quality.",
  },
  {
    stat: "Boundaries (BND)",
    copy: "Your Impact dimension: stars, forks, and followers combined, with heavy diminishing returns so popularity alone can't dominate the card.",
  },
  {
    stat: "Catches (CAT)",
    copy: "Your Community dimension: issues closed and external contributions — so maintainers and reviewers get credit, not just people shipping their own code.",
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
            The six stats above are read against each other on <em>your own</em> card — so your relatively
            strongest signal gets pushed up and your relatively weakest gets pulled down, showing where
            you lean as a player. That&apos;s deliberately just for the card face and the star ratings —
            it answers &quot;what are you relatively best at,&quot; not &quot;how good are you overall.&quot;
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            Your Overall rating is calculated separately, from your absolute, real-world numbers — never
            from this relative shape. That split matters: a strong, active profile shouldn&apos;t be able
            to out-rate a genuinely stronger one just by having a more &quot;balanced&quot; looking card.
          </p>
        </div>

        <div className="stagger-row mt-10 border-t border-chalk/10 pt-6">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">Overall rating</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            Built from seven weighted dimensions — Engineering Activity, Collaboration, Consistency,
            Project Depth, Impact, Breadth, and Community — each scored 0-100 against realistic, diminishing-returns
            curves, not against other users. Engineering Activity (commit volume) is the single strongest
            factor. Collaboration rewards merged PRs into other people&apos;s repos most, but also gives
            real credit for shipping your own repos consistently, so having zero external PRs doesn&apos;t
            collapse your score — it&apos;s the normal state for most solo builders and students. Impact
            (stars/forks/followers) is capped hard so popularity alone can&apos;t dominate a card. You can
            see your own breakdown, dimension by dimension, on your profile page.
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            Once you have a rating on file, a new measurement blends in gradually rather than jumping
            straight to whatever we measure that day — so a single noisy read can&apos;t whipsaw your
            number, but a real, sustained change shows up clearly within a couple of regenerations.
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
