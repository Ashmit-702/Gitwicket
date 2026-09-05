"use client";

import { useEffect, useState } from "react";
import type { CricketCardStats } from "@/lib/cricketStats";
import { loadCareerLocal } from "@/lib/careerStorage";

export default function ConnectedSources({ card }: { card: CricketCardStats }) {
  const [hasCv, setHasCv] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);

  useEffect(() => {
    const local = loadCareerLocal(card.login);
    setHasCv(!!local?.parsedCv);
    setLinkedinUrl(local?.answers.linkedinUrl || null);
  }, [card.login]);

  const chips = [
    { label: "GitHub", state: card.platform === "github" ? "verified" : "unconnected" },
    { label: "LeetCode", state: card.platform === "leetcode" ? "verified" : "unconnected" },
    { label: "CV", state: hasCv ? "connected" : "unconnected" },
    { label: "LinkedIn", state: linkedinUrl ? "connected" : "unconnected", href: linkedinUrl },
  ] as const;

  const stateLabel: Record<string, string> = {
    verified: "Verified",
    connected: "Connected",
    unconnected: "Not connected",
  };

  return (
    <div className="border-t border-chalk/10 pt-8">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-bail">Connected sources</p>
      <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-chalk/60">
        GitWicket doesn&apos;t just show what you claim — it shows the evidence behind it.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const isPositive = c.state === "verified" || c.state === "connected";
          const content = (
            <span
              className={`rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide ${
                isPositive ? "bg-bail/10 text-bail" : "bg-chalk/5 text-chalk/30"
              }`}
            >
              {c.label} · {stateLabel[c.state]}
            </span>
          );
          return "href" in c && c.href ? (
            <a key={c.label} href={c.href.startsWith("http") ? c.href : `https://${c.href}`} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            <span key={c.label}>{content}</span>
          );
        })}
      </div>
      <p className="mt-2 font-body text-[11px] text-chalk/25">
        LinkedIn is a link only — nothing is scraped or imported, and it never affects the {card.rating} rating above.
      </p>
    </div>
  );
}
