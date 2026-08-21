"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function WinnerGlow({ isWinner, children }: { isWinner: boolean; children: ReactNode }) {
  if (!isWinner) return <>{children}</>;
  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none absolute -inset-3 rounded-[28px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.3] }}
        transition={{ duration: 1, delay: 1.7, ease: "easeOut" }}
        style={{ background: "radial-gradient(closest-side, rgba(217,169,59,0.5), transparent 75%)" }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-1 rounded-[24px] border-2 border-bail/70"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: [0, 1, 0.6], scale: [0.96, 1.02, 1] }}
        transition={{ duration: 0.9, delay: 1.7, ease: "easeOut" }}
      />
      {children}
    </div>
  );
}
