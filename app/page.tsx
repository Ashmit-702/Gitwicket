import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/getCard";
import CricketCard from "@/components/CricketCard";
import AttributesPanel from "@/components/AttributesPanel";
import ScoutingMetrics from "@/components/ScoutingMetrics";
import DistributionChart from "@/components/DistributionChart";
import ShareButton from "@/components/ShareButton";
import PageReveal from "@/components/PageReveal";

export const dynamic = "force-dynamic";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard(params.username);
  if (!card) return { title: "Player not found — GitWicket" };

  const title = `${card.name} — ${card.rating} RTG ${card.role} | GitWicket`;
  const description = `${card.name}'s GitHub, rated as a cricket card: ${card.strikeRate} strike rate, ${card.wickets} wickets, ${card.boundaries} boundaries. ${card.tier} tier.`;
  const imageUrl = `/api/card/${card.login}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [imageUrl] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

export default async function UserCardPage({ params }: Props) {
  const card = await getCard(params.username);
  if (!card) notFound();

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden px-6 py-8">
      <div className="floodlights"><span className="ember" /></div>

      {/* top nav */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:text-bail">
          <span aria-hidden>←</span> Back
        </a>
        <a
          href="/how-it-works"
          className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail"
        >
          How it works ↗
        </a>
      </div>

      {/* headline */}
      <PageReveal className="relative z-10 mx-auto mt-8 max-w-6xl">
        <p className="font-display text-xs uppercase tracking-widest text-bail">GitWicket</p>
        <h1 className="mt-1 font-display text-4xl font-black uppercase italic text-chalk sm:text-5xl">{card.name}</h1>
        <p className="mt-1 font-body text-sm text-chalk/60">
          {card.tier} tier {card.role} · @{card.login} · {card.signatureStat}
        </p>
      </PageReveal>

      {/* three-column layout */}
      <div className="relative z-10 mx-auto mt-10 flex max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center">
        <PageReveal delay={0.1} className="order-2 lg:order-1">
          <AttributesPanel card={card} />
        </PageReveal>

        <PageReveal delay={0} y={28} className="order-1 flex flex-col items-center lg:order-2">
          <CricketCard card={card} />
          <ShareButton login={card.login} name={card.name} rating={card.rating} tier={card.tier} platform="github" />
          <a
            href={`/compare?with=${card.login}`}
            className="mt-3 font-display text-xs uppercase tracking-widest text-chalk/40 transition hover:text-leather"
          >
            Compare with a friend →
          </a>
        </PageReveal>

        <PageReveal delay={0.15} className="order-3 space-y-6">
          <ScoutingMetrics card={card} />
          <DistributionChart card={card} />
        </PageReveal>
      </div>

      {/* embed section */}
      <PageReveal delay={0.2} className="relative z-10 mx-auto mt-14 max-w-xl border-t border-chalk/10 pt-6 text-left">
        <p className="font-display text-xs uppercase tracking-widest text-bail">Embed this card</p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-turf/40 bg-pitch p-4 font-mono text-xs text-chalk/80">
{`[![${card.login}'s GitWicket card](https://gitwicket.dev/api/card/${card.login})](https://gitwicket.dev/${card.login})`}
        </pre>
        <a
          href="/"
          className="mt-6 inline-block font-display text-xs font-bold uppercase tracking-widest text-bail transition hover:opacity-80"
        >
          Rate another GitHub →
        </a>
      </PageReveal>
    </main>
  );
}
