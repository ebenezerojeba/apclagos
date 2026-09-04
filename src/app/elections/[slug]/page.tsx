import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card } from "@/components/ui/primitives";
import { CandidateCard } from "@/components/cards/PersonCard";
import { AwaitingRecordsState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import { getCandidates, getElectionBySlug, getElections } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { electionOfficeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { ElectionOffice } from "@/types/content";

export async function generateStaticParams() {
  const elections = await getElections();
  return elections.map((election) => ({ slug: election.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const election = await getElectionBySlug(slug);
  if (!election) return { title: "Election not found" };

  return buildMetadata({
    title: election.name,
    description:
      election.summary ??
      `${election.name} — offices contested and candidates fielded by APC Lagos.`,
    path: `/elections/${election.slug}`,
    keywords: [election.name, `APC Lagos ${election.year}`, "Lagos election"],
  });
}

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const election = await getElectionBySlug(slug);
  if (!election) notFound();

  const candidates = await getCandidates({ electionSlug: election.slug });

  const byOffice = election.offices.map((office) => ({
    office,
    candidates: candidates.filter((candidate) => candidate.office === office),
  }));

  return (
    <>
      <PageHeader
        eyebrow={`Election ${election.year}`}
        title={election.name}
        description={election.summary}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Elections", href: "/elections" },
          { name: election.name, href: `/elections/${election.slug}` },
        ]}
        aside={
          <Button href="/candidates" variant="inverse" size="sm">
            Candidate directory
          </Button>
        }
      >
        <HeaderFacts
          items={[
            {
              label: "Polling date",
              value: election.date ? formatDate(election.date) : "To be announced",
            },
            { label: "Offices contested", value: election.offices.length },
            { label: "Published candidates", value: candidates.length },
            { label: "Status", value: election.phase },
          ]}
        />
      </PageHeader>

      {election.description?.length ? (
        <Section tone="canvas" size="sm">
          <div className="prose-institutional max-w-3xl">
            {election.description.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {!election.date ? (
            <Card className="mt-8 flex max-w-3xl flex-row items-start gap-4 border-brass-200 bg-brass-100/50 p-5">
              <CalendarClock
                className="mt-0.5 size-5 shrink-0 text-brass-600"
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-fg-muted">
                The polling date for this cycle has not been published. This page
                will be updated when the Independent National Electoral Commission
                releases the electoral timetable.
              </p>
            </Card>
          ) : null}
        </Section>
      ) : null}

      {candidates.length === 0 ? (
        <Section tone="surface">
          <AwaitingRecordsState
            what="Candidate profiles"
            dataFile="the admin, under Elections → Candidates"
          />
        </Section>
      ) : (
        byOffice
          .filter((group) => group.candidates.length > 0)
          .map((group, index) => (
            <Section
              key={group.office}
              tone={index % 2 === 0 ? "surface" : "canvas"}
              ariaLabelledBy={`office-${group.office}`}
            >
              <SectionHeader
                as="h2"
                eyebrow="Candidates"
                title={
                  <span id={`office-${group.office}`}>
                    {electionOfficeLabels[group.office as ElectionOffice]}
                  </span>
                }
                description={`${group.candidates.length} published ${
                  group.candidates.length === 1 ? "candidate" : "candidates"
                } for this office.`}
              />
              <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.candidates.map((candidate) => (
                  <StaggerItem key={candidate.slug}>
                    <CandidateCard candidate={candidate} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </Section>
          ))
      )}
    </>
  );
}
