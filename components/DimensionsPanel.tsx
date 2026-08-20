import type { CricketCardStats } from "@/lib/cricketStats";

function summarize(card: CricketCardStats): string {
  if (!card.dimensions || card.dimensions.length === 0) return "";
  const sorted = [...card.dimensions].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  return `${strongest.label} is driving the rating. ${weakest.label} is currently the limiting factor.`;
}

export default function DimensionsPanel({ card }: { card: CricketCardStats }) {
  if (!card.dimensions || card.dimensions.length === 0) return null;

  return (
    <div className="w-full max-w-xs">
      <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5 transition-colors hover:border-bail/30">
        <p className="mb-1 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-bail">
          <span className="h-px w-4 bg-bail" /> Why {card.rating}?
        </p>
        <p className="mb-4 font-body text-xs text-chalk/50">{summarize(card)}</p>

        <div className="space-y-3">
          {card.dimensions.map((d) => (
            <div key={d.label}>
              <div className="flex items-baseline justify-between">
                <span className="font-body text-sm text-chalk/80">
                  {d.label}
                  <span className="ml-1.5 font-mono text-[10px] text-chalk/30">{Math.round(d.weight * 100)}%</span>
                </span>
                <span className="font-mono text-xs font-semibold text-bail">{d.score}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-chalk/10">
                <div className="h-full rounded-full bg-bail" style={{ width: `${d.score}%` }} />
              </div>
              <p className="mt-1 font-body text-[11px] leading-snug text-chalk/40">{d.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
