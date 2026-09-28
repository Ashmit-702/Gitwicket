"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export default function ComparePage({ searchParams }: { searchParams?: { with?: string } }) {
  const router = useRouter();
  const [a, setA] = useState(searchParams?.with ?? "");
  const [b, setB] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedA = a.trim().replace(/^@/, "");
    const trimmedB = b.trim().replace(/^@/, "");

    if (!trimmedA || !trimmedB) {
      setError("Enter both GitHub usernames.");
      return;
    }
    if (!USERNAME_RE.test(trimmedA) || !USERNAME_RE.test(trimmedB)) {
      setError("One of those doesn't look like a valid GitHub username.");
      return;
    }

    setError(null);
    router.push(`/compare/${trimmedA}/${trimmedB}`);
  }

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden px-6 py-8">
      <div className="floodlights">
        <span className="ember" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:text-bail">
          <span aria-hidden>←</span> Back
        </a>
      </div>

      <section className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-6 pb-12 pt-10 text-center sm:pt-16">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-xs uppercase tracking-[0.3em] text-leather"
        >
          Settle it
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 font-display text-3xl font-black uppercase italic text-chalk sm:text-4xl"
        >
          Compare two GitHubs
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 font-body text-sm text-chalk/60"
        >
          Pick a rival. See whose commits actually hit harder.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mt-8 flex w-full flex-col items-center gap-3"
        >
          <input
            type="text"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="github.com/you"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-md border-2 border-dusk bg-chalk px-4 py-3 font-mono text-sm text-ink outline-none transition focus:border-leather placeholder:text-ink/30"
          />
          <span className="font-display text-xs uppercase tracking-widest text-chalk/40">vs</span>
          <input
            type="text"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="github.com/rival"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-md border-2 border-dusk bg-chalk px-4 py-3 font-mono text-sm text-ink outline-none transition focus:border-leather placeholder:text-ink/30"
          />

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-leather py-3 font-display text-sm font-semibold uppercase tracking-widest text-chalk transition hover:scale-[1.01] hover:opacity-90 active:scale-[0.99]"
          >
            Compare
          </button>

          {error && <p className="font-mono text-xs text-leather">{error}</p>}
        </motion.form>
      </section>
    </main>
  );
}
