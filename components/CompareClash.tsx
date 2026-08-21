"use client";

import { motion } from "framer-motion";

export default function CompareClash() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0, rotate: -25, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.35 }}
    >
      {/* impact burst — a couple of rings that expand and fade right as the VS lands */}
      <motion.span
        className="absolute h-10 w-10 rounded-full border-2 border-leather/70"
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />
      <motion.span
        className="absolute h-10 w-10 rounded-full border-2 border-bail/50"
        initial={{ scale: 0.4, opacity: 0.7 }}
        animate={{ scale: 3.2, opacity: 0 }}
        transition={{ duration: 0.75, delay: 0.55, ease: "easeOut" }}
      />
      <motion.span
        className="relative font-display text-2xl font-black italic text-leather"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut", delay: 1 }}
      >
        VS
      </motion.span>
    </motion.div>
  );
}
