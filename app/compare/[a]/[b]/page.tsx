import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/getCard";
import CricketCard from "@/components/CricketCard";
import PageReveal from "@/components/PageReveal";
import CompareClash from "@/components/CompareClash";
import CompareStatPanel from "@/components/CompareStatPanel";
import CompareWinnerBanner from "@/components/CompareWinnerBanner";
import WinnerGlow from "@/components/WinnerGlow";
import type { CricketCardStats } from "@/lib/cricketStats";

export const dynamic = "force-dynamic";

type Props = { params: { a: string; b: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [a, b] = await Promise.all([getCard(params.a), getCard(params.b)]);
  if (!a || !b) return { title: "Compare — GitWicket" };
  const title = `${a.name} (${a.rating}) vs ${b.name} (${b.rating}) | GitWicket`;
  return { title, description: `Head-to-head: ${a.login} vs ${b.login} on GitWicket.` };
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
          <CompareWinnerBanner
            name={overallWinner.name}
            winnerRating={overallWinner.rating}
            loserRating={overallWinner === cardA ? cardB.rating : cardA.rating}
          />
        )}
      </PageReveal>

      <div className="relative z-10 mx-auto mt-10 flex max-w-5xl flex-col items-center justify-center gap-6 lg:flex-row lg:items-start lg:gap-4">
        <PageReveal delay={0} y={20} className="flex flex-col items-center">
          <WinnerGlow isWinner={overallWinner === cardA}>
            <CricketCard card={cardA} celebrate={false} />
          </WinnerGlow>
        </PageReveal>

        <PageReveal delay={0.15} className="w-full max-w-sm">
          <CompareStatPanel cardA={cardA} cardB={cardB} />
        </PageReveal>

        <PageReveal delay={0.3} y={20} className="flex flex-col items-center">
          <WinnerGlow isWinner={overallWinner === cardB}>
            <CricketCard card={cardB} celebrate={false} />
          </WinnerGlow>
        </PageReveal>
      </div>
    </main>
  );
}

