// Single source of truth for URLs to GitWicket's sibling products. Read from
// env so the actual destination can change (staging vs. prod CV Analyzer,
// a future domain move) without touching any component that links to it.
//
// GitWicket and CV Analyzer are deliberately kept as two separate products —
// see the Career Card CTA in components/CareerProofSection.tsx. This constant
// is the only place that URL is allowed to live; nothing else should hardcode it.
export const CV_ANALYZER_URL = process.env.NEXT_PUBLIC_CV_ANALYZER_URL || "";

// Whether the CV Analyzer integration should render at all. If the env var
// isn't set (a fresh clone of this repo, a preview deploy without secrets
// configured), the CTA is hidden entirely rather than linking to a blank or
// placeholder URL — a broken link is worse than no link.
export const CV_ANALYZER_ENABLED = CV_ANALYZER_URL.length > 0;

// ============================================================================
// BUILD MARKER — see app/page.tsx's footer.
// ============================================================================
// This is NOT a git commit SHA — this environment has no git access to your
// actual repository, so it cannot know or verify a real commit hash. This is
// a manually-bumped label, incremented once per delivered zip, so you have a
// concrete string to check for on the live site. If you see this exact
// string in your deployed footer, this specific zip's app/page.tsx is what's
// live. If you don't, something between "this zip" and "production" didn't
// take — check your own git log / Vercel deployment, since this environment
// can't see either.
export const BUILD_MARKER = "gw-dev-2026-09-21-a";
