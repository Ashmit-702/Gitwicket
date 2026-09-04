"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CvUpload from "@/components/CvUpload";
import CareerQuestions from "@/components/CareerQuestions";
import { saveCareerLocal } from "@/lib/careerStorage";
import { EMPTY_ANSWERS, type CareerAnswers } from "@/lib/careerProfile";
import type { ParsedCv } from "@/lib/cvParsing";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["GitHub", "CV", "About you"];

export default function BuildCareerCardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [parsedCv, setParsedCv] = useState<ParsedCv | null>(null);
  const [answers, setAnswers] = useState<CareerAnswers>(EMPTY_ANSWERS);
  const [generating, setGenerating] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  function handleNextFromStep1() {
    const trimmed = username.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "");
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(trimmed)) {
      setUsernameError("That doesn't look like a valid GitHub username.");
      return;
    }
    setUsername(trimmed);
    setUsernameError(null);
    setStep(2);
  }

  function handleGenerate() {
    setGenerating(true);
    saveCareerLocal(username, { parsedCv, answers });
    router.push(`/${username}/career`);
  }

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden px-6 py-10">
      <div className="floodlights">
        <span className="ember" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg">
        <a href="/" className="font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:text-bail">
          ← GitWicket
        </a>

        <h1 className="mt-6 font-display text-2xl font-black uppercase italic text-chalk sm:text-3xl">Build your Career Card</h1>
        <p className="mt-2 font-body text-sm text-chalk/60">
          Let&apos;s build a complete picture of your developer profile. Every step here is optional — add what you have.
        </p>

        {/* Step indicator */}
        <div className="mt-8 flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${n <= step ? "bg-bail text-pitch" : "bg-chalk/10 text-chalk/40"}`}>
                  {n}
                </div>
                <span className={`hidden font-display text-[10px] uppercase tracking-wide sm:inline ${n <= step ? "text-chalk/70" : "text-chalk/30"}`}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className={`h-px flex-1 ${n < step ? "bg-bail" : "bg-chalk/10"}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-10">
              <p className="font-display text-xs font-semibold uppercase tracking-widest text-bail">Step 1 — GitHub</p>
              <p className="mt-2 font-body text-sm text-chalk/60">Your GitHub is the foundation — engineering activity, projects, consistency.</p>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNextFromStep1()}
                placeholder="github.com/yourusername"
                className="mt-4 w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2.5 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
              />
              {usernameError && <p className="mt-2 font-body text-xs text-leather">{usernameError}</p>}
              <button
                onClick={handleNextFromStep1}
                className="mt-6 w-full rounded-full bg-bail py-2.5 font-display text-xs font-bold uppercase tracking-widest text-pitch transition hover:opacity-90"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-10">
              <p className="font-display text-xs font-semibold uppercase tracking-widest text-bail">Step 2 — CV</p>
              <p className="mt-2 font-body text-sm text-chalk/60">Optional, but it fills in experience, education, and skills GitHub can&apos;t show.</p>
              <div className="mt-4">
                <CvUpload onParsed={setParsedCv} />
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-full border border-chalk/20 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk/70 transition hover:border-chalk/40"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-full bg-bail py-2.5 font-display text-xs font-bold uppercase tracking-widest text-pitch transition hover:opacity-90"
                >
                  {parsedCv ? "Continue →" : "Skip →"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="mt-10">
              <p className="font-display text-xs font-semibold uppercase tracking-widest text-bail">Step 3 — About you</p>
              <p className="mt-2 font-body text-sm text-chalk/60">A few quick answers to fill gaps GitHub and your CV can&apos;t reliably tell us. All optional.</p>
              <div className="mt-5">
                <CareerQuestions
                  answers={answers}
                  onChange={setAnswers}
                  detectedProjectNames={parsedCv ? parsedCv.projects.map((p) => p.name) : []}
                />
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-full border border-chalk/20 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk/70 transition hover:border-chalk/40"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 rounded-full bg-bail py-2.5 font-display text-xs font-bold uppercase tracking-widest text-pitch transition hover:opacity-90 disabled:opacity-60"
                >
                  {generating ? "Generating…" : "Generate Career Card →"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
