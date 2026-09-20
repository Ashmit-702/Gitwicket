"use client";

import { useEffect, useState } from "react";
import type { CricketCardStats } from "@/lib/cricketStats";
import { loadCareerLocal } from "@/lib/careerStorage";

// Each source has its own honest state and its own caption describing exactly what
// it contributes — deliberately not a single ambiguous "Connected" for everything.
// This is the fix for a real, confirmed bug: LinkedIn showed "Connected" even though
// nothing is ever imported from it, which reads as "LinkedIn data was pulled in,"
// when the truth is just "a URL was typed into a form." Those are very different
// claims, and only the true one should ever be displayed.
export default function ConnectedSources({ card }: { card: CricketCardStats }) {
  const [hasCv, setHasCv] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);

  useEffect(() => {
    const local = loadCareerLocal(card.login);
    setHasCv(!!local?.parsedCv);
    setLinkedinUrl(local?.answers.linkedinUrl || null);
  }, [card.login]);

  const chips = [
    {
      label: "GitHub",
      state: card.platform === "github" ? "Verified" : "Not connected",
      caption: "Public engineering evidence",
      positive: card.platform === "github",
    },
    {
      label: "LeetCode",
      state: card.platform === "leetcode" ? "Verified" : "Not connected",
      caption: "Problem-solving evidence",
      positive: card.platform === "leetcode",
    },
    {
      label: "CV",
      state: hasCv ? "Connected" : "Not connected",
      caption: "Career claims and experience",
      positive: hasCv,
    },
    {
      label: "LinkedIn",
      state: linkedinUrl ? "Profile linked" : "Not connected", // never "Connected" — see file header
      caption: "Profile link only — not imported",
      positive: !!linkedinUrl,
      href: linkedinUrl,
    },
  ];

  return (
    <div className="border-t border-chalk/10 pt-8">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-bail">Connected sources</p>
      <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-chalk/60">
        GitWicket doesn&apos;t just show what you claim — it shows the evidence behind it.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {chips.map((c) => {
          const body = (
            <div className={`rounded-lg border px-3 py-2 ${c.positive ? "border-bail/20 bg-bail/5" : "border-chalk/10 bg-transparent"}`}>
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-bold uppercase tracking-wide text-chalk/80">{c.label}</span>
                <span className={`font-mono text-[10px] uppercase tracking-wide ${c.positive ? "text-bail" : "text-chalk/30"}`}>{c.state}</span>
              </div>
              <p className="mt-0.5 font-body text-[11px] text-chalk/40">{c.caption}</p>
            </div>
          );
          return c.href ? (
            <a key={c.label} href={c.href.startsWith("http") ? c.href : `https://${c.href}`} target="_blank" rel="noopener noreferrer">
              {body}
            </a>
          ) : (
            <div key={c.label}>{body}</div>
          );
        })}
      </div>
      <p className="mt-3 font-body text-[11px] text-chalk/25">
        LinkedIn is used as a profile link only. No data is scraped or imported, and it never affects the {card.rating} rating above.
      </p>
    </div>
  );
}
