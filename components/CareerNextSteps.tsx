export default function CareerNextSteps({ platform }: { platform: "github" | "leetcode" }) {
  const platformLabel = platform === "github" ? "GitHub" : "LeetCode";
  return (
    <div className="rounded-xl border border-dashed border-chalk/15 bg-transparent p-5">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-chalk/40">Coming next</p>
      <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
        This profile is built entirely from your public {platformLabel} activity right now. CV import — so this
        card can pull in experience, roles, and check your resume&apos;s claims against what you can actually show
        — is on the roadmap, not live yet.
      </p>
    </div>
  );
}
