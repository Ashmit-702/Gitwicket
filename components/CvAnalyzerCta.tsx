import { CV_ANALYZER_URL, CV_ANALYZER_ENABLED } from "@/lib/config";

export default function CvAnalyzerCta() {
  if (!CV_ANALYZER_ENABLED) return null;
  return (
    <div className="rounded-xl border border-chalk/10 p-5">
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
  );
}
