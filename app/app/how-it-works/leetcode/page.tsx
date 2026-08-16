export const dynamic = "force-static";

const ROWS = [
  {
    stat: "Strike rate (STR)",
    copy: "Solving pace — Easy, Medium, and Hard problems solved, weighted by difficulty and spread across your active years.",
  },
  {
    stat: "Batting average (AVG)",
    copy: "Total problems solved, averaged across your active years — years you actually had submissions, not just years since you signed up.",
  },
  {
    stat: "Wickets (WKT)",
    copy: "Hard problems solved, all-time. These are weighted heavily and don't come cheap — a handful of Hard solves won't max this out.",
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
    copy: "Rated contests entered, plus overall problems solved — so grinders who never touch the contest feature still get credit, not just competitive solvers.",
  },
];

export default function HowItWorksLeetCodePage() {
  return (
    <main className="mow-lines min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <a href="/" className="font-display text-xs uppercase tracking-widest text-[#E2852B]">
            ← GitWicket
          </a>
          <a href="/how-it-works" className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail">
            GitHub version →
          </a>
        </div>

        <h1 className="stagger-row mt-6 font-display text-3xl font-black uppercase italic text-chalk">
          How LeetCode gets rated
        </h1>
        <p className="stagger-row mt-4 font-body text-sm leading-relaxed text-chalk/70">
          LeetCode cards are pulled from your public profile — solved counts, acceptance rate, and contest
          history. Same six-stat card as GitHub, different source, and its own tier colors so you can tell
          the two apart at a glance.
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
          <p className="font-display text-sm font-bold uppercase tracking-wide text-[#E2852B]">Overall rating</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            A weighted blend of all six stats, ranging from 8 to 92. Hard problems and Medium problems are
            calibrated so a realistic grinder — a few hundred solved, a modest Hard count — lands solidly in
            Bronze-to-Silver, not maxed out. The 90s ("Legend" tier) are a separate gate: at least 3 active
            years, a 1900+ contest rating, and 300+ problems solved. Volume alone doesn't get you there without
            the contest strength to back it up.
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
            LeetCode doesn't publish an official public API — this pulls from the same endpoint LeetCode's own
            site uses for public profile pages. Fields like join date aren't exposed, so "active years" is
            approximated from years with any submission activity rather than account age.
          </p>
        </div>
      </div>
    </main>
  );
}
