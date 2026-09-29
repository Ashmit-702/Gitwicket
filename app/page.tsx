import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "How GitWicket works",
  alternates: { canonical: "/how-it-works" },
};

// Index only. The per-platform explanations live in their own routes so that
// this file can never again be a byte-copy of one of them (that duplication is
// what let an earlier deploy serve the wrong page). scripts/verify-routes.ts
// fails the build if these files ever become identical again.
const GUIDES = [
  { href: "/how-it-works/github", title: "GitHub rating", copy: "How commits, projects, collaboration and impact become your cricket stats and overall rating." },
  { href: "/how-it-works/leetcode", title: "LeetCode rating", copy: "How solved problems, difficulty mix, contests and consistency become a LeetCode card." },
];

export default function HowItWorksIndexPage() {
  return (
    <main className="mow-lines min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail">← Home</Link>
        <p className="mt-10 font-display text-xs font-bold uppercase tracking-[0.25em] text-[#E2852B]">How it works</p>
        <h1 className="mt-3 font-display text-4xl font-black uppercase italic text-chalk md:text-5xl">Pick a rating to unpack.</h1>
        <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-chalk/60">
          The Cricket Card rating comes only from public GitHub or LeetCode activity. Your CV, career answers and LinkedIn link
          never change it — they only feed the Career Card.
        </p>
        <ul className="mt-10 divide-y divide-chalk/10 border-y border-chalk/10">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="group flex items-start justify-between gap-6 py-6 transition hover:pl-2">
                <span>
                  <span className="block font-display text-xl font-black uppercase text-chalk">{g.title}</span>
                  <span className="mt-2 block max-w-lg font-body text-sm text-chalk/50">{g.copy}</span>
                </span>
                <span aria-hidden className="text-2xl text-chalk/20 transition group-hover:text-[#E2852B]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
