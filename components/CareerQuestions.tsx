"use client";

import type { CareerAnswers } from "@/lib/careerProfile";

const TARGET_ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "AI/ML Engineer", "Data Scientist",
  "Data Engineer", "DevOps / Cloud", "Cybersecurity", "Mobile Developer", "Software Engineer", "Other",
];
const CURRENT_STATUSES = ["Student", "Looking for internship", "Looking for full-time", "Working", "Freelancing", "Building a startup", "Other"];
const EXPERIENCE_YEARS = ["No professional experience", "<1 year", "1-2 years", "2-4 years", "4-7 years", "7+ years"];
const FOCUS_AREAS = ["Frontend", "Backend", "AI/ML", "Data", "DevOps/Cloud", "Mobile", "Security", "Systems"];
const GOALS = ["Get internship", "Get full-time job", "Switch role", "Become stronger engineer", "Build startup", "Open source", "Higher studies", "Freelance", "Other"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk/60">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PillGroup({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : opt)}
            className={`rounded-full border px-3 py-1.5 font-body text-xs transition ${
              selected ? "border-bail bg-bail/10 text-bail" : "border-chalk/15 text-chalk/60 hover:border-chalk/30"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiPillGroup({ options, values, onChange, max }: { options: string[]; values: string[]; onChange: (v: string[]) => void; max: number }) {
  function toggle(opt: string) {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else if (values.length < max) {
      onChange([...values, opt]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = values.includes(opt);
        const disabled = !selected && values.length >= max;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => toggle(opt)}
            className={`rounded-full border px-3 py-1.5 font-body text-xs transition ${
              selected ? "border-bail bg-bail/10 text-bail" : disabled ? "border-chalk/10 text-chalk/25" : "border-chalk/15 text-chalk/60 hover:border-chalk/30"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function CareerQuestions({
  answers,
  onChange,
  detectedProjectNames,
}: {
  answers: CareerAnswers;
  onChange: (a: CareerAnswers) => void;
  detectedProjectNames: string[]; // from CV + matched GitHub repos — lets Q5 be a selection, not blank free text
}) {
  function set<K extends keyof CareerAnswers>(k: K, v: CareerAnswers[K]) {
    onChange({ ...answers, [k]: v });
  }

  const proudestOptions = [...detectedProjectNames, "Other"];
  const isOtherProject = answers.proudestProject !== null && !detectedProjectNames.includes(answers.proudestProject);

  return (
    <div className="space-y-6">
      <Field label="1. What role are you targeting?">
        <PillGroup options={TARGET_ROLES} value={answers.targetRole} onChange={(v) => set("targetRole", v)} />
      </Field>

      <Field label="2. What best describes you right now?">
        <PillGroup options={CURRENT_STATUSES} value={answers.currentStatus} onChange={(v) => set("currentStatus", v)} />
      </Field>

      <Field label="3. How much professional experience do you have?">
        <PillGroup options={EXPERIENCE_YEARS} value={answers.experienceYears} onChange={(v) => set("experienceYears", v)} />
        <p className="mt-1.5 font-body text-[11px] text-chalk/30">This is about your real career, not your GitHub account age — we won&apos;t guess it for you.</p>
      </Field>

      <Field label="4. What's your primary technical focus? (up to 2)">
        <MultiPillGroup options={FOCUS_AREAS} values={answers.primaryFocus} onChange={(v) => set("primaryFocus", v)} max={2} />
      </Field>

      {detectedProjectNames.length > 0 ? (
        <Field label="5. Which project are you most proud of?">
          <PillGroup
            options={proudestOptions}
            value={isOtherProject ? "Other" : answers.proudestProject}
            onChange={(v) => set("proudestProject", v === "Other" ? "" : v)}
          />
          {(isOtherProject || answers.proudestProject === "") && (
            <input
              value={isOtherProject ? answers.proudestProject || "" : ""}
              onChange={(e) => set("proudestProject", e.target.value || "Other")}
              placeholder="Project name"
              className="mt-2 w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
            />
          )}
        </Field>
      ) : (
        <Field label="5. Which project are you most proud of? (optional)">
          <input
            value={answers.proudestProject || ""}
            onChange={(e) => set("proudestProject", e.target.value || null)}
            placeholder="Project name"
            className="w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
          />
        </Field>
      )}

      {answers.proudestProject && (
        <Field label="6. What did YOU personally build in it?">
          <input
            value={answers.personalContribution || ""}
            onChange={(e) => set("personalContribution", e.target.value || null)}
            placeholder="e.g. Built the backend API and auth system"
            className="w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
          />
          <p className="mt-1.5 font-body text-[11px] text-chalk/30">A project can have many contributors — this is about your specific part.</p>
        </Field>
      )}

      <Field label="7. Main goal for the next 12 months?">
        <PillGroup options={GOALS} value={answers.twelveMonthGoal} onChange={(v) => set("twelveMonthGoal", v)} />
      </Field>

      <Field label="LinkedIn profile URL (optional)">
        <input
          value={answers.linkedinUrl || ""}
          onChange={(e) => set("linkedinUrl", e.target.value || null)}
          placeholder="linkedin.com/in/yourname"
          className="w-full rounded-lg border border-chalk/15 bg-transparent px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/30 focus:border-bail focus:outline-none"
        />
        <p className="mt-1.5 font-body text-[11px] text-chalk/30">We just link to it — nothing is imported or scraped from LinkedIn.</p>
      </Field>
    </div>
  );
}
