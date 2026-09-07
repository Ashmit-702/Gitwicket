"use client";

import { motion } from "framer-motion";

const SAMPLE = {
  rating: 68,
  form: 71,
  role: "AI/ML Engineer",
  strengths: ["Engineering Activity", "Project Strength"],
  projects: ["Exam Grading Platform", "Sentiment Analyzer"],
  proof: [
    { label: "Python", status: "Strong" },
    { label: "Flask", status: "Moderate" },
  ],
};

export default function CareerCardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-chalk/10 bg-pitch/60 p-5"
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-chalk/30">Sample profile — illustrative</p>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-widest text-leather">Career rating</p>
          <p className="font-display text-4xl font-black italic text-chalk">{SAMPLE.rating}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xs uppercase tracking-widest text-leather">Form</p>
          <p className="font-display text-xl font-bold text-chalk">{SAMPLE.form}</p>
        </div>
      </div>
      <p className="mt-1 font-body text-xs text-chalk/50">{SAMPLE.role}</p>

      <div className="mt-4 border-t border-chalk/10 pt-4">
        <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-widest text-bail">Strengths</p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE.strengths.map((s) => (
            <span key={s} className="rounded-full bg-bail/10 px-2.5 py-1 font-mono text-[10px] text-bail">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-widest text-bail">Projects</p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE.projects.map((p) => (
            <span key={p} className="rounded-full bg-chalk/5 px-2.5 py-1 font-mono text-[10px] text-chalk/60">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 font-display text-[10px] font-semibold uppercase tracking-widest text-bail">Career proof</p>
        <div className="space-y-1">
          {SAMPLE.proof.map((p) => (
            <div key={p.label} className="flex items-center justify-between font-body text-xs">
              <span className="text-chalk/60">{p.label}</span>
              <span className="rounded-full bg-chalk/5 px-2 py-0.5 font-mono text-[9px] uppercase text-chalk/40">{p.status} evidence</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
