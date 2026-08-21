"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export default function CountUp({
  value,
  duration = 1,
  delay = 0,
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, delay]);

  return <span className={className}>{display}</span>;
}
