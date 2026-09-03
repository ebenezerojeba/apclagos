import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card, DataList, ArrowLink } from "@/components/ui/primitives";
import { StatCard } from "@/components/cards/ContentCards";
import { Counter, StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import { MilestoneTimeline } from "@/components/sections/MilestoneTimeline";
import { Button } from "@/components/ui/Button";
import { aboutFacts, aboutIntro, milestones, missionVision } from "@/data/about";
import { getHeadlineStats } from "@/data/stats";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: "About APC Lagos",
  description:
    "The history, organisation and structure of the All Progressives Congress, Lagos State Chapter — from the party's formation in 2013 to its organisation across 57 local councils today.",
  path: "/about",
  keywords: [
    "About APC Lagos",
    "APC history",
    "All Progressives Congress Lagos State",
  ],
});

export default function AboutPage() {
  const stats = getHeadlineStats();
  const placeholders = [
    missionVision.mission,
    missionVision.vision,
  ].filter((item) => item.placeholder).length;

  return (
    <>
      <PageHeader
        eyebrow={aboutIntro.eyebrow}
        title={aboutIntro.title}
        description={aboutIntro.lede}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Party founded", value: siteConfig.founded },
            { label: "Local councils", value: 57 },
            { label: "Senatorial districts", value: 3 },
            { label: "State constituencies", value: 40 },
          ]}
        />
      </PageHeader>

      {/* Introduction */}
      <Section tone="canvas" ariaLabelledBy="about-intro-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 id="about-intro-heading" className="sr-only">
              Introduction
            </h2>
            <div className="prose-institutional max-w-3xl">
              {aboutIntro.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
          <Card className="h-fit p-6 lg:p-7">
            <h3 className="font-display text-lg text-fg">At a glance</h3>
            <DataList items={aboutFacts} className="mt-2" />
          </Card>
        </div>
      </Section>

      {/* Mission, vision, principles */}
      <Section tone="surface" ariaLabelledBy="mission-heading">
        <SectionHeader
          as="h2"
          eyebrow="Purpose"
          title={<span id="mission-heading">Mission, vision and principles</span>}
        />

        {placeholders > 0 ? (
          <Card className="mt-8 flex-row items-start gap-4 border-brass-200 bg-brass-100/50 p-5">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-brass-600"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-fg-muted">
              <strong className="font-semibold text-fg">
                Awaiting official wording.
              </strong>{" "}
              The statements below are placeholders describing what belongs here.
              They are not party doctrine. Replace them with the chapter&rsquo;s
              approved mission, vision and statement of principles in{" "}
              <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                src/data/about.ts
              </code>
              .
            </p>
          </Card>
        ) : null}

        <StaggerGroup className="mt-10 grid gap-5 lg:grid-cols-3">
          {[missionVision.mission, missionVision.vision].map((item) => (
            <StaggerItem key={item.title}>
              <Card className="h-full p-7">
                <h3 className="font-display text-xl text-fg">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {item.body}
                </p>
              </Card>
            </StaggerItem>
          ))}
          <StaggerItem>
            <Card className="h-full p-7">
              <h3 className="font-display text-xl text-fg">
                {missionVision.values.title}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {missionVision.values.items.map((value) => (
                  <li
                    key={value}
                    className="flex gap-3 text-sm leading-relaxed text-fg-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-brass-400"
                    />
                    {value}
                  </li>
                ))}
              </ul>
            </Card>
          </StaggerItem>
        </StaggerGroup>
      </Section>

      {/* Timeline */}
      <Section tone="ink" ariaLabelledBy="history-heading" id="history" grain>
        <SectionHeader
          as="h2"
          tone="dark"
          eyebrow="History"
          title={<span id="history-heading">Milestones</span>}
          description="Matters of public record in the party's national history, with space for the Lagos chapter's own milestones."
        />

        <MilestoneTimeline milestones={milestones} />
      </Section>

      {/* Structure statistics */}
      <Section tone="muted" ariaLabelledBy="about-structure-heading">
        <SectionHeader
          as="h2"
          eyebrow="Organisation"
          title={<span id="about-structure-heading">How Lagos is organised</span>}
          description="The structural figures behind the party's organisation across the state."
          action={
            <Button href="/structure" variant="outline">
              Structure explorer
            </Button>
          }
        />
        <div className="mt-12 grid overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              stat={stat}
              className="group outline outline-border -outline-offset-[0.5px]"
            >
              <Counter value={stat.value} />
            </StatCard>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <ArrowLink href="/leadership">Leadership structure</ArrowLink>
          <ArrowLink href="/councils">All 57 local councils</ArrowLink>
          <ArrowLink href="/constituencies">Constituencies</ArrowLink>
          <ArrowLink href="/wards">Wards</ArrowLink>
          <ArrowLink href="/documents">Party documents</ArrowLink>
        </div>
      </Section>
    </>
  );
}
