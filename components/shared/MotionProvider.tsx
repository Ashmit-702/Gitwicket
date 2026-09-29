"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// One switch for the whole site: every framer-motion animation honours the
// visitor's prefers-reduced-motion setting (transforms are dropped, opacity stays).
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
