"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CricketCard from "@/components/CricketCard";
import { SHOWCASE_CARDS } from "@/lib/showcaseCards";

type Platform = "github" | "leetcode";

const TICKER = [
  { login: "torvalds", rating: 96, tier: "Legend", platform: "github" as Platform },
  { login: "gaearon", rating: 87, tier: "Gold", platform: "github" as Platform },
  { login: "neetcode", rating: 94, tier: "Legend", platform: "leetcode" as Platform },
  { login: "sindresorhus", rating: 91, tier: "Legend", platform: "github" as Platform },
  { login: "yyx990803", rating: 89, tier: "Gold", platform: "github" as Platform },
  { login: "tj", rating: 84, tier: "Gold", platform: "github" as Platform },
  { login: "addyosmani", rating: 79, tier: "Silver", platform: "github" as Platform },
  { login: "kentcdodds", rating: 82, tier: "Gold", platform: "github" as Platform },
];

const PLATFORM_COPY: Record<
  Platform,
  { accent: string; tagline: string; headline: [string, string]; body: string; placeholder: string; prefix: string }
> = {
  github: {
    accent: "#D9A93B",
    tagline: "Rate your GitHub out of 99",
    headline: ["Your GitHub, rated", "as a cricket card"],
    body: "Commits become strike rate. Pull requests become wickets. Stars become boundaries. Enter a GitHub username and get your card in seconds.",
    placeholder: "torvalds",
    prefix: "github.com/",
  },
  leetcode: {
    accent: "#E2852B",
    tagline: "Rate your LeetCode out of 99",
    headline: ["Your LeetCode, rated", "as a cricket card"],
    body: "Hard problems become wickets. Medium problems become boundaries. Acceptance rate becomes economy. Enter a LeetCode username and get your card in seconds.",
    placeholder: "neetcode",
    prefix: "leetcode.com/u/",
  },
};

export default function HomePage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("github");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const copy = PLATFORM_COPY[platform];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim().replace(/^@/, "");

    if (!trimmed) {
      setError(`Enter a ${platform === "github" ? "GitHub" : "LeetCode"} username first.`);
      return;
    }

    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-_]{0,37}[a-zA-Z0-9])?$/.test(trimmed)) {
      setError("That doesn't look like a valid username.");
      return;
    }

    setError(null);
    router.push(platform === "github" ? `/${trimmed}` : `/lc/${trimmed}`);
  }

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden">
      <div className="floodlights"><span className="ember" /></div>

      {/* nav */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-bail">GitWicket</span>
        <div className="flex items-center gap-5">
          <a href="/compare" className="font-display text-xs uppercase tracking-widest text-chalk/60 transition hover:text-leather">
            Compare two ⚔
          </a>
          <a href="/how-it-works" className="font-display text-xs uppercase tracking-widest text-chalk/60 transition hover:text-bail">
            How it works ↗
          </a>
          <a
            href="https://github.com/Ashmit-702/GitWicket"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-chalk/20 px-3 py-1.5 font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:border-bail/50 hover:text-bail"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </div>

      {/* hero */}
      <section className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-12 pt-6 text-center sm:pt-12">
        {/* platform toggle */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex rounded-full border border-chalk/15 bg-pitch/60 p-1"
        >
          <motion.div
            className="absolute inset-y-1 rounded-full"
            animate={{ left: platform === "github" ? "4px" : "50%", right: platform === "github" ? "50%" : "4px" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            style={{ background: copy.accent }}
          />
          <button
            type="button"
            onClick={() => {
              setPlatform("github");
              setError(null);
            }}
            className={`relative z-10 rounded-full px-5 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors ${
              platform === "github" ? "text-ink" : "text-chalk/60"
            }`}
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => {
              setPlatform("leetcode");
              setError(null);
            }}
            className={`relative z-10 rounded-full px-5 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors ${
              platform === "leetcode" ? "text-ink" : "text-chalk/60"
            }`}
          >
            LeetCode
          </button>
        </motion.div>

        <motion.p
          key={`tagline-${platform}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 font-display text-xs uppercase tracking-[0.3em]"
          style={{ color: copy.accent }}
        >
          {copy.tagline}
        </motion.p>

        <motion.h1
          key={`headline-${platform}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mt-4 max-w-2xl font-display text-4xl font-black uppercase italic leading-[1.05] text-chalk sm:text-6xl"
        >
          {copy.headline[0]}
          <br className="hidden sm:block" /> {copy.headline[1]}
        </motion.h1>

        <motion.p
          key={`body-${platform}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-5 max-w-md font-body text-sm text-chalk/70 sm:text-base"
        >
          {copy.body}
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          onSubmit={handleSubmit}
          className="mt-9 flex w-full max-w-sm flex-col items-center gap-3"
        >
          <div
            className="flex w-full items-center overflow-hidden rounded-md border-2 bg-chalk transition-shadow"
            style={{
              borderColor: focused ? copy.accent : "#2B3D6B",
              boxShadow: focused ? `0 0 0 4px ${copy.accent}33` : "none",
            }}
          >
            <span className="pl-4 font-mono text-sm text-ink/40">{copy.prefix}</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={copy.placeholder}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full bg-transparent py-3 pr-4 font-mono text-sm text-ink outline-none placeholder:text-ink/30"
            />
          </div>

          <button
            type="submit"
            style={{ background: copy.accent }}
            className="w-full rounded-md py-3 font-display text-sm font-semibold uppercase tracking-widest text-ink transition hover:scale-[1.01] hover:opacity-90 active:scale-[0.99]"
          >
            Get my card
          </button>

          {error && <p className="font-mono text-xs text-[#E0665A]">{error}</p>}
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 font-mono text-xs text-chalk/40"
        >
          or embed a live badge in your README —{" "}
          <code className="text-chalk/60">
            ![card](gitwicket.dev/api/{platform === "github" ? "card" : "lc-card"}/yourname)
          </code>
        </motion.p>
      </section>

      {/* showcase cards */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center font-display text-xs uppercase tracking-[0.3em] text-chalk/40"
        >
          A few cards already on the pitch
        </motion.p>
        <div className="flex flex-wrap items-start justify-center gap-8">
          {SHOWCASE_CARDS.map((card, i) => (
            <motion.div
              key={card.login}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="w-[230px]"
            >
              <CricketCard card={card} celebrate={false} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* social proof ticker */}
      <section className="relative z-10 overflow-hidden border-y border-chalk/10 bg-pitch/40 py-4">
        <div className="marquee-track flex w-max gap-8">
          {[...TICKER, ...TICKER].map((t, i) => (
            <a
              key={i}
              href={t.platform === "github" ? `/${t.login}` : `/lc/${t.login}`}
              className="flex shrink-0 items-center gap-2 font-mono text-xs text-chalk/50 transition hover:text-bail"
            >
              <span className="text-chalk/70">@{t.login}</span>
              <span className="rounded-full bg-bail/15 px-2 py-0.5 font-semibold text-bail">{t.rating} {t.tier}</span>
              <span className="text-[10px] uppercase tracking-widest text-chalk/30">{t.platform === "github" ? "gh" : "lc"}</span>
            </a>
          ))}
        </div>
      </section>

      {/* three-point pitch */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Two platforms, one card",
            copy: "Rate a GitHub or a LeetCode profile — each gets its own six-stat scorecard and its own visual identity.",
          },
          {
            title: "See where you rank",
            copy: "A distribution chart shows your rating against every card GitWicket has generated, so bragging rights come with a percentile.",
          },
          {
            title: "Settle the rivalry",
            copy: "Compare two profiles head-to-head, stat for stat, and find out whose commits actually hit harder.",
          },
          {
            title: "Built to be shared",
            copy: "Download your card as a PNG, post it straight to X, or embed a live badge in your README — every share is a backlink.",
          },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-chalk/10 bg-pitch/50 p-6"
          >
            <p className="font-display text-sm font-bold uppercase tracking-wide text-bail">{f.title}</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">{f.copy}</p>
          </motion.div>
        ))}
      </section>

      {/* footer CTA */}
      <section className="relative z-10 border-t border-chalk/10 px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-black uppercase italic text-chalk sm:text-3xl">
          What&apos;s your rating?
        </h2>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-5 inline-block rounded-md bg-bail px-8 py-3 font-display text-sm font-bold uppercase tracking-widest text-ink transition hover:opacity-90"
        >
          Get my card
        </a>
        <p className="mt-8 font-mono text-[11px] text-chalk/30">gitwicket.dev · built for the pavilion, not the boardroom</p>
      </section>
    </main>
  );
}
