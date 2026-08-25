import { CV_ANALYZER_URL, CV_ANALYZER_ENABLED } from "@/lib/config";
import type { Platform } from "@/lib/cricketStats";

const SOURCES: { label: string; platform: Platform }[] = [
  { label: "GitHub", platform: "github" },
  { label: "LeetCode", platform: "leetcode" },
];

export default function CareerProofSection({ platform }: { platform: Platform }) {
  return (
    <div className="border-t border-chalk/10 pt-8">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-bail">Sources</p>
      <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-chalk/60">
        GitWicket doesn&apos;t just show what you claim — it shows the evidence behind it.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {SOURCES.map((s) => {
          const verified = s.platform === platform;
          return (
            <span
              key={s.label}
              className={`rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide ${
                verified ? "bg-bail/10 text-bail" : "bg-chalk/5 text-chalk/30"
              }`}
            >
              {verified ? `Verified from ${s.label}` : s.label}
            </span>
          );
        })}
        <span className="rounded-full bg-chalk/5 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide text-chalk/30">
          CV — not yet connected
        </span>
      </div>

      {CV_ANALYZER_ENABLED && (
        <div className="mt-8 rounded-xl border border-chalk/10 p-5">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-chalk/80">Improve your career profile</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-chalk/60">
            Your GitHub shows what you&apos;ve built. Your CV shows how you present it. Analyze your CV to find
            missing skills, weak descriptions, ATS issues, and experience gaps.
          </p>
          <a
            href={CV_ANALYZER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-leather px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-chalk transition hover:opacity-90"
          >
            Analyze my CV →
          </a>
        </div>
      )}
    </div>
  );
}
