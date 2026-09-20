"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanUsername = username.trim().replace(/^@/, "");

    if (!cleanUsername) return;

    setLoading(true);
    window.location.href = `/${encodeURIComponent(cleanUsername)}`;
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
            className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-[#E2852B]"
          >
            Compare
          </Link>

          <Link
            href="/how-it-works"
            className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-[#E2852B]"
          >
            How It Works
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="max-w-4xl">
          <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-[#E2852B]">
            GitHub × Career Intelligence
          </p>

          <h1 className="mt-5 font-display text-5xl font-black uppercase italic leading-[0.9] text-chalk sm:text-6xl md:text-8xl">
            Your developer
            <br />
            career,{" "}
            <span className="text-[#E2852B]">
              scouted.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl font-body text-base leading-relaxed text-chalk/65 md:text-lg">
            Turn your GitHub into a cricket card in seconds. Then build a
            deeper career profile from your projects, CV, coding activity and
            career goals.
          </p>
        </div>

        {/* GitHub Card Generator */}
        <div className="mt-10 max-w-2xl">
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="github-username"
              className="mb-3 block font-display text-xs font-bold uppercase tracking-widest text-chalk/45"
            >
              GitHub username
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center border border-chalk/15 bg-chalk/[0.025] transition focus-within:border-[#E2852B]/60">
                <span className="pl-4 font-body text-chalk/30">@</span>

                <input
                  id="github-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="yourusername"
                  autoComplete="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent px-2 py-4 font-body text-base text-chalk outline-none placeholder:text-chalk/25"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="border border-[#E2852B] bg-[#E2852B] px-7 py-4 font-display text-sm font-black uppercase tracking-widest text-[#11161E] transition hover:-translate-y-0.5 hover:bg-[#F09A42] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Loading..." : "Get My Card"}
              </button>
            </div>

            <p className="mt-3 font-body text-xs text-chalk/30">
              No signup. Public GitHub data only.
            </p>
          </form>
        </div>

        {/* Career Card Highlight */}
        <section className="mt-24 border-y border-chalk/10 py-10">
          <div className="max-w-3xl">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#E2852B]">
              The deeper layer
            </p>

            <h2 className="mt-3 font-display text-3xl font-black uppercase italic text-chalk md:text-5xl">
              Build your Career Card.
            </h2>

            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-chalk/55 md:text-base">
              Go beyond a GitHub rating. Combine your work, CV, coding activity
              and career goals into one evidence-backed developer profile.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {/* Career Card CTA */}
            <Link
              href="/build-career-card"
              className="group border border-[#E2852B]/35 bg-[#E2852B]/[0.025] p-6 transition hover:border-[#E2852B]/70 hover:bg-[#E2852B]/[0.045] md:p-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
                    Career Card
                  </p>

                  <h3 className="mt-3 font-display text-2xl font-black uppercase italic text-chalk">
                    What you&apos;ve built.
                  </h3>
                </div>

                <span className="text-2xl text-chalk/25 transition group-hover:text-[#E2852B]">
                  →
                </span>
              </div>

              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
                  <span className="font-display text-xs uppercase tracking-widest text-chalk/35">
                    Career
                  </span>
                  <span className="font-body text-sm text-chalk/65">
                    Experience
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
                  <span className="font-display text-xs uppercase tracking-widest text-chalk/35">
                    Evidence
                  </span>
                  <span className="font-body text-sm text-chalk/65">
                    Public work
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-widest text-chalk/35">
                    Direction
                  </span>
                  <span className="font-body text-sm text-chalk/65">
                    Goals & gaps
                  </span>
                </div>
              </div>

              <div className="mt-8 inline-flex border border-[#E2852B] px-5 py-3 font-display text-xs font-black uppercase tracking-widest text-[#E2852B] transition group-hover:bg-[#E2852B] group-hover:text-[#11161E]">
                Build Career Card →
              </div>
            </Link>

            {/* Cricket Card explanation */}
            <div className="border border-chalk/10 bg-chalk/[0.02] p-6 md:p-8">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
                Cricket Card
              </p>

              <h3 className="mt-3 font-display text-2xl font-black uppercase italic text-chalk">
                How you play.
              </h3>

              <p className="mt-4 font-body text-sm leading-relaxed text-chalk/50">
                GitHub activity becomes a cricket player card with an overall
                rating, form, six stats, dimensions and comparison.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-2">
                {["OVR", "FORM", "STATS"].map((item) => (
                  <div
                    key={item}
                    className="border border-chalk/10 p-3"
                  >
                    <p className="font-display text-[10px] font-bold tracking-widest text-chalk/35">
                      {item}
                    </p>

                    <div className="mt-3 h-2 w-2/3 bg-[#E2852B]/65" />
                  </div>
                ))}
              </div>

              <p className="mt-6 font-body text-xs text-chalk/35">
                Fast. Public. Shareable.
              </p>
            </div>
          </div>
        </section>

        {/* Product Flow */}
        <section className="py-20">
          <div className="mb-10">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#E2852B]">
              How GitWicket works
            </p>

            <h2 className="mt-3 font-display text-3xl font-black uppercase italic text-chalk md:text-4xl">
              From code to career.
            </h2>
          </div>

          <div className="grid gap-0 border-y border-chalk/10 md:grid-cols-3">
            <div className="border-b border-chalk/10 py-8 md:border-b-0 md:border-r md:pr-8">
              <span className="font-display text-xs font-bold tracking-widest text-[#E2852B]">
                01
              </span>

              <h3 className="mt-3 font-display text-xl font-black uppercase text-chalk">
                Get your card
              </h3>

              <p className="mt-3 font-body text-sm leading-relaxed text-chalk/50">
                Enter a GitHub username and get a cricket-style developer card
                in seconds.
              </p>
            </div>

            <div className="border-b border-chalk/10 py-8 md:border-b-0 md:border-r md:px-8">
              <span className="font-display text-xs font-bold tracking-widest text-[#E2852B]">
                02
              </span>

              <h3 className="mt-3 font-display text-xl font-black uppercase text-chalk">
                Build your profile
              </h3>

              <p className="mt-3 font-body text-sm leading-relaxed text-chalk/50">
                Add your CV and answer a few meaningful career questions.
              </p>
            </div>

            <div className="py-8 md:pl-8">
              <span className="font-display text-xs font-bold tracking-widest text-[#E2852B]">
                03
              </span>

              <h3 className="mt-3 font-display text-xl font-black uppercase text-chalk">
                See the evidence
              </h3>

              <p className="mt-3 font-body text-sm leading-relaxed text-chalk/50">
                Understand strengths, gaps, project evidence and how your CV
                lines up with your public work.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border border-[#E2852B]/25 bg-[#E2852B]/[0.025] p-7 md:p-10">
          <div className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-widest text-[#E2852B]">
                Career Card
              </p>

              <h2 className="mt-2 font-display text-2xl font-black uppercase italic text-chalk md:text-3xl">
                Go beyond the rating.
              </h2>

              <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-chalk/50">
                Build a profile around what you&apos;ve actually built, what
                you want next and what your public evidence supports.
              </p>
            </div>

            <Link
              href="/build-career-card"
              className="shrink-0 border border-[#E2852B] px-6 py-3 font-display text-xs font-black uppercase tracking-widest text-[#E2852B] transition hover:bg-[#E2852B] hover:text-[#11161E]"
            >
              Build Career Card →
            </Link>
          </div>
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t border-chalk/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-chalk/30">
            GitWicket
          </p>

          <div className="flex flex-wrap gap-5">
            <Link
              href="/compare"
              className="font-body text-xs text-chalk/35 transition hover:text-chalk"
            >
              Compare
            </Link>

            <Link
              href="/build-career-card"
              className="font-body text-xs text-chalk/35 transition hover:text-chalk"
            >
              Career Card
            </Link>

            <Link
              href="/how-it-works"
              className="font-body text-xs text-chalk/35 transition hover:text-chalk"
            >
              How It Works
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}