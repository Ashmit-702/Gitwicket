import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/getCard";
import { careerSummary } from "@/lib/cricketStats";
import PageReveal from "@/components/PageReveal";
import CareerSnapshot from "@/components/CareerSnapshot";
import CareerStrengths from "@/components/CareerStrengths";
import CareerDimensionsGrid from "@/components/CareerDimensionsGrid";
import CareerNextSteps from "@/components/CareerNextSteps";

export const dynamic = "force-dynamic";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard(params.username);
  if (!card) return { title: "Player not found — GitWicket" };
  const title = `${card.name}'s career card — ${card.rating} | GitWicket`;
  return { title, description: `${card.name}'s developer career, scouted: engineering, projects, consistency, collaboration, impact.` };
}

export default async function CareerCardPage({ params }: Props) {
  const card = await getCard(params.username);
  if (!card) notFound();
  if (!card.dimensions || card.dimensions.length === 0) notFound();

  const { strengths, developing } = careerSummary(card.dimensions);

  return (
    <main className="mow-lines relative min-h-screen overflow-hidden px-6 py-8">
      <div className="floodlights">
        <span className="ember" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl items-center justify-between">
        <a href={`/${card.login}`} className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:text-bail">
          <span aria-hidden>←</span> Back to card
        </a>
        <a href="/how-it-works" className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail">
          How it works ↗
        </a>
      </div>

      <PageReveal className="relative z-10 mx-auto mt-6 max-w-4xl">
        <p className="font-display text-xs uppercase tracking-widest text-bail">Career card</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase italic text-chalk sm:text-4xl">{card.name}</h1>
        <p className="mt-1 font-body text-sm text-chalk/60">
          @{card.login} · {card.tier} tier {card.role}
        </p>
      </PageReveal>

      <div className="relative z-10 mx-auto mt-8 max-w-4xl space-y-8">
        <PageReveal delay={0.05}>
          <CareerSnapshot card={card} />
        </PageReveal>

        <PageReveal delay={0.1}>
          <CareerStrengths strengths={strengths} developing={developing} />
        </PageReveal>

        <PageReveal delay={0.15}>
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-widest text-bail">Full breakdown, with evidence</p>
          <CareerDimensionsGrid dimensions={card.dimensions} />
        </PageReveal>

        <PageReveal delay={0.2}>
          <CareerNextSteps platform={card.platform} />
        </PageReveal>
      </div>
    </main>
  );
}
