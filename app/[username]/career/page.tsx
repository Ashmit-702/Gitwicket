import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCard } from "@/lib/getCard";
import { careerSummary } from "@/lib/cricketStats";
import PageReveal from "@/components/PageReveal";
import CareerSnapshot from "@/components/CareerSnapshot";
import CareerStrengths from "@/components/CareerStrengths";
import CareerDimensionsGrid from "@/components/CareerDimensionsGrid";
import CareerEnrichment from "@/components/CareerEnrichment";
import CareerProofSection from "@/components/CareerProofSection";
import ShareCareerProfile from "@/components/ShareCareerProfile";

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

      <div className="relative z-10 mx-auto flex max-w-3xl items-center justify-between">
        <a href={`/${card.login}`} className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-chalk/70 transition hover:text-bail">
          <span aria-hidden>←</span> Back to card
        </a>
        <a href="/how-it-works" className="font-display text-xs uppercase tracking-widest text-chalk/50 transition hover:text-bail">
          How it works ↗
        </a>
      </div>

      <PageReveal className="relative z-10 mx-auto mt-8 max-w-3xl">
        <p className="font-display text-xs uppercase tracking-widest text-bail">Career card</p>
        <h1 className="mt-1 font-display text-3xl font-black uppercase italic text-chalk sm:text-4xl">{card.name}</h1>
        <p className="mt-1 font-body text-sm text-chalk/60">
          @{card.login} · {card.tier} tier {card.role}
        </p>
        <p className="mt-3 max-w-lg font-body text-sm text-chalk/50">See the evidence behind your developer profile.</p>
      </PageReveal>

      {/* One continuous story, not a pile of cards — sections separated by whitespace
          and dividers rather than repeated borders/boxes. */}
      <div className="relative z-10 mx-auto mt-10 max-w-3xl space-y-12">
        <PageReveal delay={0.05}>
          <CareerSnapshot card={card} />
        </PageReveal>

        <PageReveal delay={0.1}>
          <CareerStrengths strengths={strengths} developing={developing} />
        </PageReveal>

        <PageReveal delay={0.15}>
          <p className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-bail">Your profile at a glance</p>
          <p className="mb-4 font-body text-xs text-chalk/40">Tap a row to see the evidence behind it.</p>
          <CareerDimensionsGrid dimensions={card.dimensions} />
        </PageReveal>

        <PageReveal delay={0.2}>
          <CareerEnrichment card={card} />
        </PageReveal>

        <PageReveal delay={0.25}>
          <CareerProofSection platform={card.platform} />
        </PageReveal>

        <PageReveal delay={0.3} className="border-t border-chalk/10 pt-8">
          <ShareCareerProfile login={card.login} name={card.name} rating={card.rating} />
        </PageReveal>
      </div>
    </main>
  );
}
