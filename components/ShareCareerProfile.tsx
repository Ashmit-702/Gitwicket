"use client";

import { useState } from "react";

export default function ShareCareerProfile({ login, name, rating }: { login: string; name: string; rating: number }) {
  const [copied, setCopied] = useState(false);

  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://gitwicket.dev/${login}/career`;
  const tweetText = `${name}'s career profile on GitWicket: ${rating} rating, evidence-backed.\n\nSee the evidence behind your own GitHub:`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  function handleTweet() {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        onClick={handleTweet}
        className="flex-1 rounded-full border border-chalk/20 bg-pitch/60 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk transition hover:border-bail/50 hover:text-bail"
      >
        Share career profile
      </button>
      <button
        onClick={handleCopy}
        className="flex-1 rounded-full border border-chalk/20 bg-pitch/60 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk transition hover:border-bail/50 hover:text-bail"
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}
