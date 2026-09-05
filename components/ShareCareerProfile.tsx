"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadCareerLocal } from "@/lib/careerStorage";

export default function ShareCareerProfile({ login, name, rating }: { login: string; name: string; rating: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTargetRole(loadCareerLocal(login)?.answers.targetRole || null);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [login]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://gitwicket.dev/${login}/career`;
  // Only claims what's actually verified — rating and role (a self-reported career
  // answer, framed as such), never anything CV-derived that isn't public on this page.
  const shareText = [
    `I just checked my GitWicket Career Card.`,
    ``,
    `Career Rating: ${rating}`,
    targetRole ? `Aiming for: ${targetRole}` : null,
    `GitHub: @${login}`,
    ``,
    `See my profile:`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: `${name}'s GitWicket Career Card`, text: shareText, url: pageUrl });
      setOpen(false);
    } catch {
      // user cancelled the native share sheet — not an error, just close quietly
      setOpen(false);
    }
  }

  function handleTweet() {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer,width=550,height=420");
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-full border border-chalk/20 bg-pitch/60 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk transition hover:border-bail/50 hover:text-bail"
      >
        Share career profile
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-chalk/15 bg-pitch shadow-xl"
          >
            {canNativeShare && (
              <button onClick={handleNativeShare} className="block w-full px-4 py-3 text-left font-body text-sm text-chalk/80 transition hover:bg-chalk/5">
                Share…
              </button>
            )}
            <button onClick={handleCopy} className="block w-full px-4 py-3 text-left font-body text-sm text-chalk/80 transition hover:bg-chalk/5">
              {copied ? "Link copied!" : "Copy link"}
            </button>
            <button onClick={handleTweet} className="block w-full px-4 py-3 text-left font-body text-sm text-chalk/80 transition hover:bg-chalk/5">
              Share on X
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
