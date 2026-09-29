import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/getCard";
import CricketCard from "@/components/CricketCard";
import PageReveal from "@/components/PageReveal";
import CompareClash from "@/components/CompareClash";
import CompareStatPanel from "@/components/CompareStatPanel";
import CompareWinnerBanner from "@/components/CompareWinnerBanner";
import WinnerGlow from "@/components/WinnerGlow";
import HeadToHead from "@/components/compare/HeadToHead";
import CompareDimensions, { LEVEL_MARGIN } from "@/components/compare/CompareDimensions";
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

  const overallWinner = Math.abs(cardA.rating - cardB.rating) < LEVEL_MARGIN ? null : cardA.rating > cardB.rating ? cardA : cardB;

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

      <div className="relative z-10 mx-auto mt-8 max-w-6xl"><HeadToHead a={cardA} b={cardB} /></div>

      <div className="relative z-10">
        <CompareDimensions a={cardA} b={cardB} />
      </div>

      <details className="relative z-10 mx-auto mt-14 max-w-5xl border-t border-chalk/10 pt-6">
        <summary className="cursor-pointer font-display text-xs font-bold uppercase tracking-widest text-chalk/55 hover:text-[#E2852B]">Show both full cards</summary>
        <div className="mt-8 flex flex-col items-center justify-center gap-8 lg:flex-row">
          <CricketCard card={cardA} celebrate={false} />
          <CricketCard card={cardB} celebrate={false} />
        </div>
      </details>
    </main>
  );
}

