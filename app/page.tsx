"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CareerCardPreview from "@/components/CareerCardPreview";
import Reveal from "@/components/home/Reveal";
import { BUILD_MARKER } from "@/lib/config";

const STEPS = [
  { n: "01", t: "Get your Cricket Card", c: "GitHub username in. Rated card out, in seconds.", tag: "Instant" },
  { n: "02", t: "Build your Career Card", c: "GitHub + CV + LeetCode + career goals, one structured profile.", tag: "Deeper" },
  { n: "03", t: "Understand your evidence", c: "Strengths, gaps, Career Proof and what to do next.", tag: "Useful" },
];
const INPUTS = ["GitHub", "CV", "LeetCode", "Career goals", "Evidence"];
const cta = "whitespace-nowrap font-display text-sm font-black uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2852B]";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const u = username.trim().replace(/^@/, "");
    if (!u) return;
    setLoading(true);
    router.push(`/${encodeURIComponent(u)}`);
  }

  return (
    <main className="mow-lines min-h-screen overflow-x-hidden">
      <div className="floodlights" aria-hidden><span className="ember" /></div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-6">
        <Link href="/" className="font-display text-sm font-black uppercase tracking-[0.18em] text-chalk">GitWicket</Link>
        <nav className="flex items-center gap-5 sm:gap-7">
          {[["/compare", "Compare"], ["/how-it-works", "How it works"]].map(([h, l]) => (
            <Link key={h} href={h} className="font-display text-xs uppercase tracking-widest text-chalk/55 transition hover:text-[#E2852B]">{l}</Link>
          ))}
          <Link href="/build-career-card" className="hidden border border-[#E2852B]/60 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-[#E2852B] transition hover:bg-[#E2852B] hover:text-[#11161E] sm:block">Career Card</Link>
        </nav>
      </header>

      {/* HERO — the instant Cricket Card is primary */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-16">
        <motion.p initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#E2852B]">The developer scouting report</motion.p>
        <h1 className="mt-5 font-display text-[3.25rem] font-black uppercase italic leading-[0.86] text-chalk sm:text-7xl md:text-[6.75rem]">
          {["Your developer", "career,"].map((line, i) => (
            <motion.span key={line} className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}>{line}</motion.span>
          ))}
          <motion.span className="block text-[#E2852B]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>scouted.</motion.span>
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mt-7 max-w-xl font-body text-base leading-relaxed text-chalk/70 md:text-lg">
          Turn your GitHub into a cricket card in seconds. Then build a deeper career profile from your work, CV and coding history.
        </motion.p>

        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.55 }} className="mt-9 max-w-2xl">
          <label htmlFor="github-username" className="mb-3 block font-display text-xs font-bold uppercase tracking-widest text-chalk/50">GitHub username</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center border border-chalk/20 bg-chalk/[0.03] transition focus-within:border-[#E2852B]">
              <span className="pl-4 text-chalk/35" aria-hidden>@</span>
              <input id="github-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourusername" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                className="min-w-0 flex-1 bg-transparent px-2 py-4 text-base text-chalk outline-none placeholder:text-chalk/30" />
            </div>
            <button type="submit" disabled={loading || !username.trim()} className={`${cta} border border-[#E2852B] bg-[#E2852B] px-8 py-4 text-[#11161E] hover:-translate-y-0.5 hover:bg-[#F09A42] disabled:cursor-not-allowed disabled:opacity-40`}>
              {loading ? "Scouting…" : "Get my card"}
            </button>
            <Link href="/build-career-card" className={`${cta} border border-[#E2852B]/70 px-6 py-4 text-center text-[#E2852B] hover:bg-[#E2852B]/10`}>Build career card</Link>
          </div>
          <p className="mt-3 text-xs text-chalk/40">No signup · public GitHub data only · the Cricket Card never needs a CV</p>
        </motion.form>
      </section>

      {/* CAREER CARD — major product, right below the hero */}
      <section className="relative z-10 border-y border-[#E2852B]/20 bg-[#E2852B]/[0.035]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1fr_1.05fr] md:gap-16 md:py-20">
          <Reveal>
            <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-[#E2852B]">Career Card</p>
            <h2 className="mt-3 font-display text-5xl font-black uppercase italic leading-[0.9] text-chalk md:text-7xl">What you&apos;ve built.</h2>
            <p className="mt-5 max-w-md font-body text-base leading-relaxed text-chalk/70">Not a parsed CV. A scouting report: what you&apos;re good at, what your public work actually supports, what&apos;s missing, and what to do next.</p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-display text-xs uppercase tracking-widest text-chalk/60">
              {INPUTS.map((i, k) => (<li key={i} className="flex items-center gap-5">{i}{k < INPUTS.length - 1 && <span className="text-[#E2852B]" aria-hidden>+</span>}</li>))}
            </ul>
            <Link href="/build-career-card" className={`${cta} mt-9 inline-block border border-[#E2852B] bg-[#E2852B] px-8 py-4 text-[#11161E] hover:-translate-y-0.5 hover:bg-[#F09A42]`}>Build my career card →</Link>
          </Reveal>
          <CareerCardPreview />
        </div>
      </section>

      {/* STORY */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-24">
        <div className="grid divide-y divide-chalk/10 border-y border-chalk/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
              <div className="flex items-baseline justify-between"><span className="font-display text-4xl font-black italic text-[#E2852B]/80">{s.n}</span><span className="font-display text-[10px] uppercase tracking-widest text-chalk/40">{s.tag}</span></div>
              <h3 className="mt-4 font-display text-xl font-black uppercase text-chalk">{s.t}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">{s.c}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-chalk/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-chalk/40">GitWicket</p>
          <div className="flex flex-wrap gap-5 font-body text-xs text-chalk/50">
            <Link href="/compare" className="hover:text-chalk">Compare</Link>
            <Link href="/build-career-card" className="hover:text-chalk">Career Card</Link>
            <Link href="/how-it-works" className="hover:text-chalk">How it works</Link>
          </div>
          <p className="font-mono text-[10px] text-chalk/25" data-build={BUILD_MARKER}>{BUILD_MARKER}</p>
        </div>
      </footer>
    </main>
  );
}
