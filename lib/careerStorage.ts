"use client";

import type { ParsedCv } from "./cvParsing";
import type { CareerAnswers } from "./careerProfile";

// ============================================================================
// This is intentionally the ONLY place Career Card enrichment data is stored.
// No server, no database, no auth — per the brief: "use a temporary/local/
// session approach first rather than suddenly introducing a full auth system."
// It also happens to be the cleanest privacy boundary available: the CV file
// itself is never stored anywhere (see app/api/parse-cv/route.ts), and the
// EXTRACTED fields only ever live in the user's own browser. The server-
// rendered Career Card page has no knowledge of any of this — it only shows
// up once this module reads it back out, client-side, after the page loads.
//
// Tradeoff, stated plainly: this data doesn't follow the user across devices
// or browsers, and clearing site data wipes it. That's the deliberate cost of
// not building an account system for this. If accounts are added later, this
// is the one module that would need to start writing to a real backend
// instead of localStorage — nothing else in the Career Card would need to
// change, since everything else already just calls loadCareerLocal().
// ============================================================================

export interface CareerLocalData {
  parsedCv: ParsedCv | null;
  answers: CareerAnswers;
  updatedAt: string;
}

function key(username: string): string {
  return `gitwicket:career:${username.toLowerCase()}`;
}

export function saveCareerLocal(username: string, data: Omit<CareerLocalData, "updatedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CareerLocalData = { ...data, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(key(username), JSON.stringify(payload));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — fail silently,
    // the wizard still works, it just won't persist across a reload.
  }
}

export function loadCareerLocal(username: string): CareerLocalData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(username));
    if (!raw) return null;
    return JSON.parse(raw) as CareerLocalData;
  } catch {
    return null;
  }
}

export function clearCareerLocal(username: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(username));
  } catch {
    // nothing to do
  }
}
