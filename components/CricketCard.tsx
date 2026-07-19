"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { CricketCardStats, Platform, Tier } from "@/lib/cricketStats";

type TierTheme = {
  fill: [string, string];
  frame: string;
  accent: string;
  ribbon: string;
  ribbonText: string;
  glow: string;
  confetti: string[];
};

const GITHUB_THEME: Record<Tier, TierTheme> = {
  Bronze: {
    fill: ["#e9d5b7", "#c9a874"],
    frame: "#8a5a3c",
    accent: "#8a5a3c",
    ribbon: "linear-gradient(90deg,#c98a56,#a9713f)",
    ribbonText: "#F4F1E8",
    glow: "drop-shadow(0 0 22px rgba(201,138,86,0.55))",
    confetti: ["#c98a56", "#8a5a3c"],
  },
  Silver: {
    fill: ["#f2f4f6", "#cfd3d7"],
    frame: "#9aa0a6",
    accent: "#6b7076",
    ribbon: "linear-gradient(90deg,#eef0f2,#c3c8cd)",
    ribbonText: "#1B1B18",
    glow: "drop-shadow(0 0 22px rgba(200,205,210,0.55))",
    confetti: ["#eef0f2", "#9aa0a6"],
  },
  Gold: {
    fill: ["#f9edc7", "#e0b94f"],
    frame: "#D9A93B",
    accent: "#8f6a24",
    ribbon: "linear-gradient(90deg,#D9A93B,#8f6a24)",
    ribbonText: "#1B1B18",
    glow: "drop-shadow(0 0 30px rgba(217,169,59,0.7))",
    confetti: ["#D9A93B", "#f4e6b8", "#8f6a24"],
  },
  Legend: {
    fill: ["#fff1de", "#eec468"],
    frame: "#1B1B18",
    accent: "#C1443B",
    ribbon: "linear-gradient(90deg,#C1443B,#D9A93B,#2B3D6B)",
    ribbonText: "#F4F1E8",
    glow: "drop-shadow(0 0 40px rgba(217,169,59,0.85))",
    confetti: ["#D9A93B", "#C1443B", "#2B3D6B", "#fff3d1"],
  },
};

// LeetCode gets its own identity — graphite/steel through Bronze/Silver, a compiler-amber
// Gold, and a violet-amber-graphite Legend — distinct enough from GitHub's navy/red/gold
// that the two platforms read as different collectibles, not a reskin of one card.
const LEETCODE_THEME: Record<Tier, TierTheme> = {
  Bronze: {
    fill: ["#e6e4de", "#b7b3a8"],
    frame: "#5b5b52",
    accent: "#5b5b52",
    ribbon: "linear-gradient(90deg,#8a8677,#5b5b52)",
    ribbonText: "#F4F1E8",
    glow: "drop-shadow(0 0 22px rgba(139,134,119,0.55))",
    confetti: ["#8a8677", "#5b5b52"],
  },
  Silver: {
    fill: ["#eef2f5", "#c1ccd4"],
    frame: "#7a8a95",
    accent: "#5b6b76",
    ribbon: "linear-gradient(90deg,#e4ecf0,#aebcc4)",
    ribbonText: "#1B1B18",
    glow: "drop-shadow(0 0 22px rgba(122,138,149,0.55))",
    confetti: ["#e4ecf0", "#7a8a95"],
  },
  Gold: {
    fill: ["#ffe3bd", "#e2852b"],
    frame: "#E2852B",
    accent: "#8a4a12",
    ribbon: "linear-gradient(90deg,#E2852B,#8a4a12)",
    ribbonText: "#F4F1E8",
    glow: "drop-shadow(0 0 30px rgba(226,133,43,0.7))",
    confetti: ["#E2852B", "#ffdca6", "#8a4a12"],
  },
  Legend: {
    fill: ["#ffe9c9", "#f0a94a"],
    frame: "#1B1B18",
    accent: "#6C3FA6",
    ribbon: "linear-gradient(90deg,#E2852B,#6C3FA6,#1B1B18)",
    ribbonText: "#F4F1E8",
    glow: "drop-shadow(0 0 40px rgba(226,133,43,0.85))",
    confetti: ["#E2852B", "#6C3FA6", "#1B1B18", "#ffe9c9"],
  },
};

const THEME_BY_PLATFORM: Record<Platform, Record<Tier, TierTheme>> = {
  github: GITHUB_THEME,
  leetcode: LEETCODE_THEME,
};

const PLATFORM_LABEL: Record<Platform, string> = { github: "GITHUB", leetcode: "LEETCODE" };

const ROLE_ABBR: Record<string, string> = {
  Batsman: "BAT",
  Bowler: "BWL",
  "All-rounder": "ALL",
  Wicketkeeper: "WK",
};

function initials(name: string, login: string) {
  const source = name && name !== login ? name : login;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function CricketCard({ card, celebrate = true }: { card: CricketCardStats; celebrate?: boolean }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const theme = THEME_BY_PLATFORM[card.platform][card.tier];
  const ref = useRef<HTMLDivElement>(null);

  // pointer-tracked 3D tilt — springy so it settles instead of snapping
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [14, -14]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-14, 14]), { stiffness: 220, damping: 20 });
  const glareX = useTransform(px, [0, 1], ["10%", "90%"]);
  const glareY = useTransform(py, [0, 1], ["10%", "90%"]);

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    setHovering(false);
    px.set(0.5);
    py.set(0.5);
  }

  useEffect(() => {
    if (!celebrate) return;
    if (card.tier !== "Gold" && card.tier !== "Legend") return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const duration = card.tier === "Legend" ? 1800 : 1000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: theme.confetti,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: theme.confetti,
        });
        if (Date.now() < end && !cancelled) requestAnimationFrame(frame);
      })();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.login, card.tier]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 24, rotateY: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 14 }}
      className="relative w-full max-w-[300px]"
      style={{ perspective: 900 }}
    >
      <motion.div
        id={`card-capture-${card.login}`}
        ref={ref}
        onPointerMove={(e) => {
          setHovering(true);
          handlePointerMove(e);
        }}
        onPointerLeave={handlePointerLeave}
        style={{ rotateX, rotateY, filter: theme.glow, transformStyle: "preserve-3d" }}
        className={`group relative touch-none rounded-[22px] ${hovering ? "" : "card-float"}`}
      >
        <svg viewBox="0 0 300 420" className="w-full">
        <defs>
          <linearGradient id={`fill-${card.login}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.fill[0]} />
            <stop offset="100%" stopColor={theme.fill[1]} />
          </linearGradient>
          <clipPath id={`shield-${card.login}`}>
            <path d="M8 44 C8 20 40 8 150 8 C260 8 292 20 292 44 L292 380 C292 402 260 412 150 412 C40 412 8 402 8 380 Z" />
          </clipPath>
          <radialGradient id={`avatar-mask-${card.login}`} cx="50%" cy="42%" r="46%">
            <stop offset="72%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`avatar-fade-${card.login}`}>
            <rect width="300" height="420" fill={`url(#avatar-mask-${card.login})`} />
          </mask>
        </defs>

        {/* card body — a cricket pavilion "honours board" plaque, not a FIFA shield */}
        <path
          d="M8 44 C8 20 40 8 150 8 C260 8 292 20 292 44 L292 380 C292 402 260 412 150 412 C40 412 8 402 8 380 Z"
          fill={`url(#fill-${card.login})`}
          stroke={theme.frame}
          strokeWidth={3}
        />
        {/* nail-hole detail — plaques hang from a nail; a small nod to the honours-board motif */}
        <circle cx="150" cy="26" r="3.5" fill={theme.accent} opacity={0.6} />
        <circle cx="150" cy="26" r="1.3" fill="#1B1B18" opacity={0.5} />

        <g clipPath={`url(#shield-${card.login})`}>
          {/* photo, faded into the card via radial mask so it blends rather than sits boxed */}
          {!avatarFailed ? (
            <image
              href={card.avatarUrl}
              x="40"
              y="30"
              width="220"
              height="220"
              preserveAspectRatio="xMidYMid slice"
              mask={`url(#avatar-fade-${card.login})`}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <text x="150" y="150" textAnchor="middle" fontSize="64" fontWeight="800" fill={theme.accent} opacity={0.35}>
              {initials(card.name, card.login)}
            </text>
          )}
        </g>

        {/* rating + tier, top-left */}
        <text x="26" y="60" fontSize="44" fontWeight="800" fontStyle="italic" fill="#1B1B18">
          {card.rating}
        </text>
        <text x="26" y="76" fontSize="10" fontWeight="700" letterSpacing="2" fill={theme.accent}>
          RATING
        </text>
        <text x="26" y="98" fontSize="13" fontWeight="700" letterSpacing="1" fill="#1B1B18" opacity={0.8}>
          {ROLE_ABBR[card.role]}
        </text>
        <rect x="26" y="106" width={PLATFORM_LABEL[card.platform].length * 6.4 + 12} height="16" rx="8" fill={theme.accent} opacity={0.16} />
        <text x="32" y="117" fontSize="9" fontWeight="700" letterSpacing="1" fill={theme.accent}>
          {PLATFORM_LABEL[card.platform]}
        </text>

        {/* name plaque */}
        <text x="150" y="268" textAnchor="middle" fontSize="24" fontWeight="900" fontStyle="italic" letterSpacing="0.5" fill="#1B1B18">
          {card.name.toUpperCase()}
        </text>
        <line x1="90" y1="278" x2="210" y2="278" stroke="#1B1B18" strokeOpacity={0.25} strokeWidth={1} />

        {/* uniform 0-99 stat grid, FUT-style */}
        {card.cardStats.map((s, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 60 : 175;
          const y = 305 + row * 32;
          return (
            <g key={s.label}>
              <text x={x} y={y} fontSize="20" fontWeight="800" fill="#1B1B18">
                {s.value}
              </text>
              <text x={x + 34} y={y - 6} fontSize="10" fontWeight="700" letterSpacing="1" fill="#1B1B18" opacity={0.65}>
                {s.abbr}
              </text>
            </g>
          );
        })}
        </svg>

        {/* pointer-tracked glare — a soft light patch that follows the cursor across the shield */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) => `radial-gradient(220px circle at ${gx} ${gy}, rgba(255,255,255,0.35), transparent 60%)`
            ),
          }}
        />

        {/* always-on diagonal shine sweep — the "premium card" cue, stronger on Gold/Legend */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
          <div className="shine-sweep" style={{ opacity: card.tier === "Legend" ? 0.9 : card.tier === "Gold" ? 0.6 : 0.3 }} />
        </div>
      </motion.div>

      {/* signature stat ribbon, overlaid below the card */}
      <div
        className="mx-auto -mt-2 w-[86%] rounded-full px-3 py-1.5 text-center shadow-md"
        style={{ background: theme.ribbon }}
      >
        <span className="font-display text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.ribbonText }}>
          ★ {card.signatureStat}
        </span>
      </div>

      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-chalk/40">
        gitwicket.dev · {card.accountAgeYears}yr career · {card.activeYears}yr active
      </p>
    </motion.div>
  );
}
