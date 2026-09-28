"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const USERNAME_RE =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

function cleanUsername(value: string) {
  return value
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/.*$/, "");
}

export default function ComparePage() {
  const router = useRouter();

  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Safely support /compare?with=username
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withUser = params.get("with");

    if (withUser) {
      setA(cleanUsername(withUser));
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedA = cleanUsername(a);
    const trimmedB = cleanUsername(b);

    setError(null);

    if (!trimmedA || !trimmedB) {
      setError("Enter both GitHub usernames.");
      return;
    }

    if (!USERNAME_RE.test(trimmedA) || !USERNAME_RE.test(trimmedB)) {
      setError("One of those doesn't look like a valid GitHub username.");
      return;
    }

    if (trimmedA.toLowerCase() === trimmedB.toLowerCase()) {
      setError("Pick two different GitHub users.");
      return;
    }

    setLoading(true);

    router.push(
      `/compare/${encodeURIComponent(trimmedA)}/${encodeURIComponent(
        trimmedB
      )}`
    );
  }

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden px-6 py-8">
      {/* Ambient background */}
      <div className="floodlights" aria-hidden="true">
        <span className="ember" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-chalk/65 transition hover:text-chalk"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          Back
        </Link>

        <Link
          href="/how-it-works"
          className="font-display text-xs uppercase tracking-widest text-chalk/35 transition hover:text-[#E2852B]"
        >
          How it works
        </Link>
      </header>

      {/* Main */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] max-w-xl flex-col items-center justify-center px-2 pb-16 pt-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#E2852B]"
        >
          Settle it
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-3 font-display text-4xl font-black uppercase italic leading-none text-chalk sm:text-5xl"
        >
          Compare two
          <br />
          GitHubs
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16 }}
          className="mt-4 max-w-md font-body text-sm leading-relaxed text-chalk/55"
        >
          Put two developer profiles head-to-head and compare their GitWicket
          ratings, stats and dimensions.
        </motion.p>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          onSubmit={handleSubmit}
          className="mt-9 w-full"
        >
          <div className="border border-chalk/10 bg-chalk/[0.025] p-4 sm:p-5">
            {/* Player A */}
            <div className="text-left">
              <label
                htmlFor="player-a"
                className="mb-2 block font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#E2852B]"
              >
                Developer 01
              </label>

              <div className="flex items-center rounded-md border-2 border-dusk bg-chalk transition focus-within:border-[#E2852B]">
                <span className="pl-4 font-mono text-sm text-ink/35">
                  @
                </span>

                <input
                  id="player-a"
                  type="text"
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                  placeholder="github.com/you"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent px-2 py-3.5 font-mono text-sm text-ink outline-none placeholder:text-ink/30"
                />
              </div>
            </div>

            {/* VS */}
            <div className="flex items-center gap-3 py-4">
              <div className="h-px flex-1 bg-chalk/10" />

              <span className="font-display text-xs font-black uppercase tracking-[0.25em] text-chalk/30">
                VS
              </span>

              <div className="h-px flex-1 bg-chalk/10" />
            </div>

            {/* Player B */}
            <div className="text-left">
              <label
                htmlFor="player-b"
                className="mb-2 block font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#E2852B]"
              >
                Developer 02
              </label>

              <div className="flex items-center rounded-md border-2 border-dusk bg-chalk transition focus-within:border-[#E2852B]">
                <span className="pl-4 font-mono text-sm text-ink/35">
                  @
                </span>

                <input
                  id="player-b"
                  type="text"
                  value={b}
                  onChange={(e) => setB(e.target.value)}
                  placeholder="github.com/rival"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-transparent px-2 py-3.5 font-mono text-sm text-ink outline-none placeholder:text-ink/30"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="mt-4 text-left font-mono text-xs text-red-400"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-md bg-[#E2852B] py-3.5 font-display text-sm font-black uppercase tracking-widest text-[#11161E] transition hover:-translate-y-0.5 hover:bg-[#F09A42] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading…" : "Compare"}
            </button>
          </div>
        </motion.form>

        {/* Small footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-5 max-w-sm font-body text-xs leading-relaxed text-chalk/30"
        >
          Compare ratings, form, player stats and underlying dimensions —
          without changing either profile.
        </motion.p>
      </section>
    </main>
  );
}
