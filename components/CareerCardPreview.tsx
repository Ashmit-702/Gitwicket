"use client";

import { motion } from "framer-motion";

// Fictional, anonymised sample — never real user data.
const S = {
  name: "Sample Developer", role: "AI / ML Engineer", ovr: 68, form: 74,
  strongest: ["Engineering", "Consistency"], needs: ["Cloud", "Testing"],
  projects: [{ n: "Exam Grading Platform", s: "Live demo · limited traction" }, { n: "Sentiment Analyzer", s: "Public repository" }],
  proof: [{ k: "Python", l: 4, t: "Strong" }, { k: "NLP", l: 3, t: "Moderate" }, { k: "AWS", l: 1, t: "Limited" }, { k: "Kubernetes", l: 0, t: "No public evidence" }],
};
const H = "font-display text-[10px] font-bold uppercase tracking-[0.2em] text-chalk/40";

export default function CareerCardPreview() {
  return (
    <motion.figure initial={{ opacity: 0, y: 24, rotate: 0.6 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -4 }} aria-label="Sample Career Card"
      className="relative m-0 border border-[#E2852B]/40 bg-[#0B1018] p-5 shadow-[0_30px_60px_-30px_rgba(226,133,43,0.35)] sm:p-6">
      <span className="absolute -top-3 left-5 bg-[#E2852B] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#11161E]">Sample</span>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-black uppercase italic text-chalk">{S.name}</p>
          <p className="font-display text-xs uppercase tracking-widest text-[#E2852B]">{S.role}</p>
        </div>
        <div className="flex shrink-0 gap-5 text-right">
          {[["OVR", S.ovr], ["FORM", S.form]].map(([k, v]) => (
            <div key={k as string}><p className={H}>{k}</p><p className="font-display text-4xl font-black italic leading-none text-chalk">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-chalk/10 py-4">
        <div><p className={H}>Strongest</p><p className="mt-1.5 font-body text-sm text-chalk/80">{S.strongest.join(" · ")}</p></div>
        <div><p className={H}>Needs evidence</p><p className="mt-1.5 font-body text-sm text-chalk/80">{S.needs.join(" · ")}</p></div>
      </div>

      <p className={`${H} mt-4`}>Projects</p>
      <ul className="mt-2 space-y-1.5">
        {S.projects.map((p) => (
          <li key={p.n} className="flex items-baseline justify-between gap-3 font-body text-sm"><span className="truncate text-chalk/85">{p.n}</span><span className="shrink-0 text-[11px] text-chalk/40">{p.s}</span></li>
        ))}
      </ul>

      <p className={`${H} mt-5`}>Career Proof</p>
      <ul className="mt-2 space-y-2.5">
        {S.proof.map((p, i) => (
          <li key={p.k}>
            <div className="flex justify-between font-body text-xs"><span className="font-semibold text-chalk/85">{p.k}</span><span className={p.l >= 3 ? "text-[#E2852B]" : "text-chalk/40"}>{p.t}</span></div>
            <div className="mt-1 flex gap-1" aria-hidden>
              {[0, 1, 2, 3].map((s) => (
                <motion.span key={s} className={`h-1 flex-1 origin-left ${s < p.l ? "bg-[#E2852B]" : "bg-chalk/10"}`} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 + i * 0.1 + s * 0.05 }} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </motion.figure>
  );
}
