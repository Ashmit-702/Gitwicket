"use client";

import type { CareerAnswers } from "@/lib/careerProfile";

const DEVELOPER_TYPES = ["Frontend", "Backend", "Full Stack", "AI/ML", "Data", "DevOps/Cloud", "Mobile", "Security", "Systems", "Other"];
const EXPERIENCE_LEVELS = ["Student", "0-1", "1-2", "2-4", "4-7", "7+"];
const LOOKING_FOR = ["Internship", "Full-time", "Freelance", "Not looking"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk/60">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PillGroup({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-full border px-3 py-1.5 font-body text-xs transition ${
            value === opt ? "border-bail bg-bail/10 text-bail" : "border-chalk/15 text-chalk/60 hover:border-chalk/30"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function CareerQuestions({ answers, onChange }: { answers: CareerAnswers; onChange: (a: CareerAnswers) => void }) {
  function set<K extends keyof CareerAnswers>(k: K, v: CareerAnswers[K]) {
    onChange({ ...answers, [k]: v });
  }

  return (
    <div className="space-y-6">
      <Field label="What type of developer are you aiming to become?">
        <PillGroup options={DEVELOPER_TYPES} value={answers.developerType} onChange={(v) => set("developerType", v)} />
      </Field>

      <Field label="What role are you currently targeting? (optional)">
        <input
          value={answers.targetRole || ""}
          onChange={(e) => set("targetRole", e.target.value || null)}
          placeholder="e.g. Backend Engineer"
          className="w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
        />
      </Field>

      <Field label="Years of professional/industry experience">
        <PillGroup options={EXPERIENCE_LEVELS} value={answers.experienceLevel} onChange={(v) => set("experienceLevel", v)} />
      </Field>

      <Field label="Currently looking for">
        <PillGroup options={LOOKING_FOR} value={answers.lookingFor} onChange={(v) => set("lookingFor", v)} />
      </Field>

      <Field label="Which project are you most proud of? (optional)">
        <input
          value={answers.proudestProject || ""}
          onChange={(e) => set("proudestProject", e.target.value || null)}
          placeholder="Project name"
          className="w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
        />
        {answers.proudestProject && (
          <input
            value={answers.personalContribution || ""}
            onChange={(e) => set("personalContribution", e.target.value || null)}
            placeholder="What did you personally build in it?"
            className="mt-2 w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
          />
        )}
      </Field>

      <Field label="What are you trying to achieve in the next 12 months? (optional)">
        <input
          value={answers.twelveMonthGoal || ""}
          onChange={(e) => set("twelveMonthGoal", e.target.value || null)}
          placeholder="e.g. Get my first internship"
          className="w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
        />
      </Field>
    </div>
  );
}
