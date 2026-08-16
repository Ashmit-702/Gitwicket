import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/getCard";
import CricketCard from "@/components/CricketCard";
import PageReveal from "@/components/PageReveal";
import type { CricketCardStats } from "@/lib/cricketStats";

export const dynamic = "force-dynamic";

type Props = { params: { a: string; b: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [a, b] = await Promise.all([getCard(params.a), getCard(params.b)]);
  if (!a || !b) return { title: "Compare — GitWicket" };
  const title = `${a.name} (${a.rating}) vs ${b.name} (${b.rating}) | GitWicket`;
  return { title, description: `Head-to-head: ${a.login} vs ${b.login} on GitWicket.` };
}

function Winner({ av, bv }: { av: number; bv: number }) {
  if (av === bv) return <span className="text-chalk/40">tied</span>;
  return av > bv ? (
    <span className="font-semibold text-bail">◀ {av}</span>
  ) : (
    <span className="font-semibold text-bail">{bv} ▶</span>
  );
}

export default async function ComparePage({ params }: Props) {
  const [cardA, cardB]: [CricketCardStats | null, CricketCardStats | null] = await Promise.all([
    getCard(params.a),
    getCard(params.b),
  ]);
  if (!cardA || !cardB) notFound();

  const overallWinner = cardA.rating === cardB.rating ? null : cardA.rating > cardB.rating ? cardA : cardB;

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden px-6 py-8">
      <div className="floodlights">
        <span className="ember" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:text-bail">
          <span aria-hidden>←</span> Back
        </a>
        <a href="/compare" className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail">
          Compare someone else
        </a>
      </div>

      <PageReveal className="relative z-10 mx-auto mt-6 max-w-6xl text-center">
        <p className="font-display text-xs uppercase tracking-widest text-leather">Head to head</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase italic text-chalk sm:text-4xl">
          @{cardA.login} <span className="text-chalk/30">vs</span> @{cardB.login}
        </h1>
        {overallWinner && (
          <p className="mt-2 font-body text-sm text-chalk/60">
            <span className="font-semibold text-bail">{overallWinner.name}</span> takes it, {overallWinner.rating} RTG to{" "}
            {overallWinner === cardA ? cardB.rating : cardA.rating}.
          </p>
        )}
      </PageReveal>

      <div className="relative z-10 mx-auto mt-10 flex max-w-5xl flex-col items-center justify-center gap-10 lg:flex-row lg:items-start">
        <PageReveal delay={0} y={20} className="flex flex-col items-center">
          <CricketCard card={cardA} celebrate={false} />
        </PageReveal>

        <PageReveal delay={0.15} className="w-full max-w-sm lg:mt-10">
          <div className="rounded-xl border border-chalk/10 bg-pitch/60 p-5">
            <p className="mb-4 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-leather">
              <span className="h-px w-4 bg-leather" /> Stat for stat
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-chalk/10 pb-2">
                <span className="font-body text-sm text-chalk/80">Overall rating</span>
                <Winner av={cardA.rating} bv={cardB.rating} />
              </div>
              {cardA.cardStats.map((s, i) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="font-body text-sm text-chalk/70">{s.label}</span>
                  <Winner av={s.value} bv={cardB.cardStats[i].value} />
                </div>
              ))}
            </div>
          </div>
        </PageReveal>

        <PageReveal delay={0.3} y={20} className="flex flex-col items-center">
          <CricketCard card={cardB} celebrate={false} />
        </PageReveal>
      </div>
    </main>
  );
}
