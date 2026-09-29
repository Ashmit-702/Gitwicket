"use client";

import { motion } from "framer-motion";

// Illustrative sample only — fictional, anonymised, never real user data.
const SAMPLE = {
  role: "AI/ML Engineer",
  claims: [
    { skill: "Python", level: 4, status: "Strong evidence", note: "4 repos · recent activity" },
    { skill: "NLP", level: 3, status: "Moderate evidence", note: "2 repos · README + deps" },
    { skill: "AWS", level: 1, status: "Limited evidence", note: "1 older repo" },
    { skill: "Kubernetes", level: 0, status: "No public evidence", note: "CV claim only" },
  ],
  next: "Your CV lists AWS, but public evidence is limited. Deploy one project there and document the architecture.",
};

export default function CareerCardPreview() {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="m-0 border border-chalk/10 bg-pitch/70 p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)]"
      aria-label="Sample Career Card preview"
    >
      <figcaption className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-chalk/35">
        <span>Sample · illustrative</span>
        <span className="text-[#E2852B]">Target: {SAMPLE.role}</span>
      </figcaption>

      <p className="mt-5 font-display text-[11px] font-bold uppercase tracking-widest text-chalk/45">Career Proof</p>
      <ul className="mt-3 divide-y divide-chalk/10 border-y border-chalk/10">
        {SAMPLE.claims.map((c, i) => (
          <li key={c.skill} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-sm font-black uppercase text-chalk">{c.skill}</span>
              <span className={`font-body text-[11px] ${c.level >= 3 ? "text-[#E2852B]" : "text-chalk/45"}`}>{c.status}</span>
            </div>
            <div className="mt-2 flex items-center gap-1" aria-hidden>
              {[0, 1, 2, 3].map((seg) => (
                <motion.span
                  key={seg}
                  className={`h-1 flex-1 origin-left ${seg < c.level ? "bg-[#E2852B]" : "bg-chalk/10"}`}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.1 + seg * 0.05 }}
                />
              ))}
            </div>
            <p className="mt-1.5 font-body text-[11px] text-chalk/35">{c.note}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 font-display text-[11px] font-bold uppercase tracking-widest text-chalk/45">Next step</p>
      <p className="mt-1.5 font-body text-xs leading-relaxed text-chalk/65">{SAMPLE.next}</p>
    </motion.figure>
  );
}
