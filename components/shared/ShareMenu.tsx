"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SITE_URL } from "@/lib/config";

// One share control for every surface. Never navigates away: "Share" only opens
// a menu; X opens in a separate window; Copy Link confirms in place.
export default function ShareMenu({ path, text, label = "Share" }: { path: string; text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const url = `${SITE_URL}${path}`;

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copy this link", url); }
  }
  const item = "block w-full px-4 py-3 text-left font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:bg-chalk/5 hover:text-[#E2852B] focus-visible:bg-chalk/5 focus-visible:outline-none";

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="border border-[#E2852B] px-5 py-3 font-display text-xs font-black uppercase tracking-widest text-[#E2852B] transition hover:bg-[#E2852B] hover:text-[#11161E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2852B]">
        {label} {copied ? "· Link copied" : "↗"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute right-0 z-30 mt-2 w-52 border border-chalk/15 bg-pitch shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)]">
            <button role="menuitem" type="button" className={item} onClick={copy}>{copied ? "Link copied ✓" : "Copy link"}</button>
            <a role="menuitem" className={item} target="_blank" rel="noopener noreferrer"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}>Share on X</a>
            {canNative && <button role="menuitem" type="button" className={item} onClick={() => navigator.share({ title: "GitWicket", text, url }).catch(() => {})}>Share via…</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
