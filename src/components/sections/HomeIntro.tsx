import Link from "next/link";
import { ArrowUpRight, Network } from "lucide-react";
import { Section } from "@/components/sections/Section";
import { SectionHeader, ArrowLink } from "@/components/ui/primitives";
import { StatCard } from "@/components/cards/ContentCards";
import { Counter, Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import { Button } from "@/components/ui/Button";
import { quickLinks, structurePromo } from "@/data/homepage";
import type { StatItem } from "@/types/content";

/** Four entry points, immediately under the hero. */
export function QuickLinks() {
  return (
    <Section tone="surface" size="sm" ariaLabelledBy="quick-links-heading">
      <h2 id="quick-links-heading" className="sr-only">
        Find information quickly
      </h2>
      <StaggerGroup className="grid overflow-hidden rounded-2xl border border-border-subtle bg-surface sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <StaggerItem
            key={item.href}
            className="bg-surface outline outline-border-subtle -outline-offset-[0.5px]"
          >
            <Link
              href={item.href}
              className="group flex h-full flex-col p-6 transition-colors hover:bg-paper-100 lg:p-7"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-display text-lg leading-snug text-fg">
                  {item.title}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-paper-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-crimson-700"
                />
              </span>
              <span className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                {item.description}
              </span>
              <span className="mt-auto pt-5 text-[0.8125rem] font-semibold text-ink-700 transition-colors group-hover:text-crimson-700">
                {item.cta}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </Section>
  );
}

/** The full statistics band. */
export function StatsBand({ stats }: { stats: StatItem[] }) {
  if (stats.length === 0) return null;

  return (
    <Section tone="muted" ariaLabelledBy="stats-heading" grain>
      <SectionHeader
        as="h2"
        eyebrow="Lagos State at a glance"
        title={<span id="stats-heading">The shape of the party across the state</span>}
        description="Structural figures for Lagos State. Each one links through to the underlying directory, and each is drawn from the data layer rather than written into the page."
        action={
          <Button href="/structure" variant="outline" iconRight={<Network className="size-4" />}>
            Structure explorer
          </Button>
        }
      />

      <StaggerGroup className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem
            key={stat.id}
            className="bg-surface outline outline-border -outline-offset-[0.5px]"
          >
            <StatCard stat={stat} className="group h-full">
              <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
            </StatCard>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </Section>
  );
}

/** Promo band pointing at the interactive structure explorer. */
export function StructurePromo() {
  const tiers = [
    { label: "State chapter", value: "APC Lagos" },
    { label: "Local Government Areas", value: "20" },
    { label: "Local Council Development Areas", value: "37" },
    { label: "Senatorial districts", value: "3" },
    { label: "Federal constituencies", value: "24" },
    { label: "State constituencies", value: "40" },
  ];

  return (
    <Section tone="ink" ariaLabelledBy="structure-promo-heading" grain>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionHeader
            as="h2"
            tone="dark"
            eyebrow={structurePromo.eyebrow}
            title={
              <span id="structure-promo-heading">{structurePromo.title}</span>
            }
            description={structurePromo.description}
          />
          <div className="mt-8">
            <Button href={structurePromo.cta.href} variant="inverse">
              {structurePromo.cta.label}
            </Button>
          </div>
        </Reveal>

        <Reveal direction="left" delay={0.1}>
          <ol className="relative border-l border-white/15 pl-8">
            {tiers.map((tier, index) => (
              <li key={tier.label} className="relative pb-7 last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[2.125rem] top-1.5 flex size-4 items-center justify-center rounded-full border border-brass-400/60 bg-ink-950"
                >
                  <span className="size-1.5 rounded-full bg-brass-300" />
                </span>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Tier {index + 1}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-2xl text-white">{tier.value}</span>
                  <span className="text-sm text-ink-200">{tier.label}</span>
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-white/10 pt-5">
            <ArrowLink href="/wards" tone="dark">
              Ward-level information
            </ArrowLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
