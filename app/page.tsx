"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const value = username.trim().replace(/^@/, "");

    if (!value) return;

    setLoading(true);
    window.location.href = `/${encodeURIComponent(value)}`;
  }

  return (
    <main className="mow-lines min-h-screen overflow-hidden">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Link
          href="/"
          className="font-display text-sm font-black uppercase tracking-[0.18em] text-chalk"
        >
          GitWicket
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/compare"
            className="font-display text-xs uppercase tracking-widest text-chalk/55 transition hover:text-[#E2852B]"
          >
            Compare
          </Link>

          <Link
            href="/how-it-works"
            className="font-display text-xs uppercase tracking-widest text-chalk/55 transition hover:text-[#E2852B]"
          >
            How it works
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="max-w-4xl">
          <p className="mb-5 font-display text-xs font-bold uppercase tracking-[0.24em] text-[#E2852B]">
            GitHub × Developer Identity
          </p>

          <h1 className="font-display text-5xl font-black uppercase italic leading-[0.9] text-chalk sm:text-6xl md:text-8xl">
            Your developer
            <br />
            career, <span className="text-[#E2852B]">scouted.</span>
          </h1>

          <p className="mt-7 max-w-2xl font-body text-base leading-relaxed text-chalk/65 md:text-lg">
            Turn your GitHub into a cricket card in seconds — then go deeper
            with an evidence-backed Career Card built from your work, CV and
            coding profile.
          </p>
        </div>

        {/* Main action */}
        <div className="mt-10 max-w-2xl">
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="github-username"
              className="mb-3 block font-display text-xs font-bold uppercase tracking-widest text-chalk/50"
            >
              GitHub username
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center border border-chalk/15 bg-chalk/[0.03] px-4 transition focus-within:border-[#E2852B]/60">
                <span className="font-body text-chalk/30">@</span>

                <input
                  id="github-username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent px-2 py-4 font-body text-base text-chalk outline-none placeholder:text-chalk/25"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="border border-[#E2852B] bg-[#E2852B] px-7 py-4 font-display text-sm font-black uppercase tracking-widest text-[#10151D] transition hover:-translate-y-0.5 hover:bg-[#F09A42] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Loading..." : "Get My Card"}
              </button>
            </div>
          </form>

          <p className="mt-3 font-body text-xs text-chalk/35">
            No signup. Public GitHub data only.
          </p>
        </div>

        {/* Product split */}
        <div className="mt-20 border-t border-chalk/10 pt-10">
          <div className="mb-7">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
              Two ways to use GitWicket
            </p>

            <h2 className="mt-2 font-display text-2xl font-black uppercase text-chalk md:text-3xl">
              One profile. Two views.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Cricket card */}
            <Link
              href={username.trim() ? `/${encodeURIComponent(username.replace(/^@/, ""))}` : "#github-username"}
              className="group border border-chalk/12 bg-chalk/[0.025] p-6 transition hover:border-[#E2852B]/50 hover:bg-chalk/[0.04] md:p-8"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
                    Cricket Card
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-black uppercase italic text-chalk">
                    How you play
                  </h3>

                  <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-chalk/55">
                    Your GitHub activity turned into a cricket-style player
                    card with rating, form, stats and comparison.
                  </p>
                </div>

                <span className="font-display text-xl text-chalk/25 transition group-hover:text-[#E2852B]">
                  →
                </span>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-2">
                {["OVR", "STR", "FORM"].map((item) => (
                  <div
                    key={item}
                    className="border border-chalk/10 px-3 py-3"
                  >
                    <p className="font-display text-[10px] font-bold tracking-widest text-chalk/35">
                      {item}
                    </p>
                    <div className="mt-2 h-2 w-2/3 bg-[#E2852B]/70" />
                  </div>
                ))}
              </div>
            </Link>

            {/* Career card */}
            <Link
              href="/build-career-card"
              className="group border border-[#E2852B]/25 bg-[#E2852B]/[0.035] p-6 transition hover:border-[#E2852B]/60 hover:bg-[#E2852B]/[0.055] md:p-8"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
                    Career Card
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-black uppercase italic text-chalk">
                    What you&apos;ve built
                  </h3>

                  <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-chalk/55">
                    Combine GitHub, your CV, coding activity and career goals
                    into one deeper developer profile.
                  </p>
                </div>

                <span className="font-display text-xl text-chalk/25 transition group-hover:text-[#E2852B]">
                  →
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2">
                {["CAREER", "EVIDENCE", "PROJECTS", "GOALS"].map((item) => (
                  <div
                    key={item}
                    className="border border-chalk/10 px-3 py-3"
                  >
                    <p className="font-display text-[10px] font-bold tracking-widest text-chalk/35">
                      {item}
                    </p>

                    <div className="mt-2 h-2 w-2/3 bg-chalk/20" />
                  </div>
                ))}
              </div>
            </Link>
          </div>
        </div>

        {/* Product story */}
        <div className="mt-20 grid border-y border-chalk/10 py-10 md:grid-cols-3">
          <div className="border-b border-chalk/10 pb-7 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
              01
            </p>
            <h3 className="mt-3 font-display text-lg font-black uppercase text-chalk">
              Get your card
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-chalk/50">
              Enter a GitHub username and get a player card in seconds.
            </p>
          </div>

          <div className="border-b border-chalk/10 py-7 md:border-b-0 md:border-r md:px-8 md:py-0">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
              02
            </p>
            <h3 className="mt-3 font-display text-lg font-black uppercase text-chalk">
              Build your profile
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-chalk/50">
              Add your CV and a few career details to go beyond GitHub stats.
            </p>
          </div>

          <div className="pt-7 md:pl-8 md:pt-0">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
              03
            </p>
            <h3 className="mt-3 font-display text-lg font-black uppercase text-chalk">
              See the evidence
            </h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-chalk/50">
              Understand what your public work actually supports — and where
              your profile can improve.
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 flex flex-col items-start justify-between gap-6 border border-chalk/10 bg-chalk/[0.025] p-6 md:flex-row md:items-center md:p-8">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
              Career Card
            </p>

            <h2 className="mt-2 font-display text-2xl font-black uppercase italic text-chalk">
              Go beyond the rating.
            </h2>

            <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-chalk/50">
              Build a profile around what you&apos;ve actually built, what
              you&apos;re aiming for and what your public evidence supports.
            </p>
          </div>

          <Link
            href="/build-career-card"
            className="shrink-0 border border-[#E2852B] px-6 py-3 font-display text-xs font-black uppercase tracking-widest text-[#E2852B] transition hover:bg-[#E2852B] hover:text-[#10151D]"
          >
            Build Career Card →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-chalk/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-7 text-xs text-chalk/35 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display uppercase tracking-widest">
            GitWicket
          </p>

          <div className="flex gap-5 font-body">
            <Link href="/compare" className="transition hover:text-chalk">
              Compare
            </Link>

            <Link
              href="/how-it-works"
              className="transition hover:text-chalk"
            >
              How it works
            </Link>

            <Link
              href="/build-career-card"
              className="transition hover:text-chalk"
            >
              Career Card
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
