import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { Badge, Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/states";
import { getCandidates, getElections } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { electionOfficeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Elections",
  description:
    "Election cycles covered by APC Lagos — the upcoming general election and the archive of past contests and candidates.",
  path: "/elections",
});

export default async function ElectionsPage() {
  const [elections, candidates] = await Promise.all([
    getElections(),
    getCandidates(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Elections"
        title="Election cycles"
        description="Each cycle collects the offices contested, the candidates fielded by APC Lagos and the constituency information a voter needs."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Elections", href: "/elections" },
        ]}
      />

      <Section tone="canvas">
        {elections.length > 0 ? (
          <ul className="grid gap-5 lg:grid-cols-2">
            {elections.map((election) => {
              const count = candidates.filter(
                (c) => c.electionSlug === election.slug,
              ).length;
              return (
                <li key={election.slug}>
                  <Card interactive className="group h-full p-7 lg:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={election.phase === "upcoming" ? "crimson" : "neutral"}>
                        {election.phase}
                      </Badge>
                      <Badge tone="outline">
                        {count > 0 ? `${count} candidates` : "Candidates pending"}
                      </Badge>
                    </div>
                    <h2 className="mt-4 font-display text-display-md leading-tight text-fg">
                      <Link
                        href={`/elections/${election.slug}`}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {election.name}
                      </Link>
                    </h2>
                    {election.summary ? (
                      <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                        {election.summary}
                      </p>
                    ) : null}
                    <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border-subtle pt-5 text-[0.8125rem]">
                      <div>
                        <dt className="text-fg-subtle">Polling date</dt>
                        <dd className="tnum mt-0.5 font-medium text-fg">
                          {election.date ? formatDate(election.date) : "To be announced"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-fg-subtle">Offices contested</dt>
                        <dd className="mt-0.5 font-medium text-fg">
                          {election.offices.length}
                        </dd>
                      </div>
                    </dl>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {election.offices.map((office) => (
                        <li
                          key={office}
                          className="rounded-full bg-paper-200 px-2.5 py-1 text-[0.6875rem] font-medium text-fg-muted"
                        >
                          {electionOfficeLabels[office]}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No election cycles published"
            description="Election cycles are configured in src/data/elections.ts."
          />
        )}
      </Section>
    </>
  );
}
