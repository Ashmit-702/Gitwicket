"use client";

import { useState } from "react";

export default function ShareButton({
  login,
  name,
  rating,
  tier,
  platform = "github",
}: {
  login: string;
  name: string;
  rating: number;
  tier: string;
  platform?: "github" | "leetcode";
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const platformLabel = platform === "github" ? "GitHub" : "LeetCode";
  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://gitwicket.dev/${login}`;
  const tweetText = `I just rated my ${platformLabel} as a ${rating} RTG ${tier}-tier cricket card on GitWicket 🏏\n\nRate yours:`;

  async function handleShare() {
    const shareData = { title: `${name}'s GitWicket card`, text: `Check out ${name}'s ${platformLabel} cricket card`, url: pageUrl };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  async function handleDownload() {
    const node = document.getElementById(`card-capture-${login}`);
    if (!node) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true, backgroundColor: undefined });
      const link = document.createElement("a");
      link.download = `${login}-gitwicket-card.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // image export can fail on cross-origin avatars without CORS headers — fail silently, tweet/copy still work
    } finally {
      setSaving(false);
    }
  }

  function handleTweet() {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  return (
    <div className="mt-5 flex w-full max-w-[300px] flex-col gap-2.5">
      <button
        onClick={handleTweet}
        className="flex items-center justify-center gap-2 rounded-full bg-bail py-3 font-display text-sm font-bold uppercase tracking-widest text-ink transition hover:scale-[1.02] hover:opacity-90 active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.2l-5.6-6.9L4 22H1l8.1-9.3L0.7 2h7.4l5.1 6.3L18.9 2Zm-1.3 18h2L6.5 4H4.4l13.2 16Z" />
        </svg>
        Post my card
      </button>

      <div className="flex gap-2.5">
        <button
          onClick={handleDownload}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-chalk/20 bg-pitch/60 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk transition hover:border-bail/50 hover:text-bail disabled:opacity-50"
        >
          {saving ? "Saving…" : "Download PNG"}
        </button>
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-chalk/20 bg-pitch/60 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk transition hover:border-bail/50 hover:text-bail"
        >
          {copied ? "Link copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
