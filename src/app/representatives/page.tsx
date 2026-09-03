import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Badge } from "@/components/ui/primitives";
import { PersonCard } from "@/components/cards/PersonCard";
import { AwaitingRecordsState } from "@/components/ui/states";
import { StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import {
  getHouseOfAssemblyMembers,
  getHouseOfRepresentativesMembers,
  getSenators,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { chamberDescriptions, chamberLabels } from "@/lib/labels";
import type { Chamber, Representative } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Elected representatives for Lagos State",
  description:
    "Senators, members of the House of Representatives and members of the Lagos State House of Assembly, searchable by district, constituency and local government.",
  path: "/representatives",
  keywords: [
    "Lagos senators",
    "Lagos House of Representatives members",
    "Lagos State House of Assembly members",
  ],
});

const SEATS: Record<Chamber, { count: number; unit: string }> = {
  senate: { count: 3, unit: "senatorial districts" },
  "house-of-representatives": { count: 24, unit: "federal constituencies" },
  "house-of-assembly": { count: 40, unit: "state constituencies" },
};

export default async function RepresentativesPage() {
  const [senators, reps, assembly] = await Promise.all([
    getSenators(),
    getHouseOfRepresentativesMembers(),
    getHouseOfAssemblyMembers(),
  ]);

  const chambers: { chamber: Chamber; members: Representative[] }[] = [
    { chamber: "senate", members: senators },
    { chamber: "house-of-representatives", members: reps },
    { chamber: "house-of-assembly", members: assembly },
  ];

  const totalPublished = senators.length + reps.length + assembly.length;

  return (
    <>
      <PageHeader
        eyebrow="Representation"
        title="Elected representatives"
        description="Lagos State is represented at three levels of the legislature. Choose a chamber to search its members by name, constituency or local government."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Representatives", href: "/representatives" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Senatorial districts", value: 3 },
            { label: "Federal constituencies", value: 24 },
            { label: "State constituencies", value: 40 },
            { label: "Published profiles", value: totalPublished },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        <StaggerGroup className="grid gap-5 lg:grid-cols-3">
          {chambers.map(({ chamber, members }) => (
            <StaggerItem key={chamber}>
              <Link
                href={`/representatives/${chamber}`}
                className="group flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-7 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="tnum font-display text-5xl leading-none text-ink-900">
                    {SEATS[chamber].count}
                  </span>
                  <Badge tone={members.length > 0 ? "verdant" : "outline"}>
                    {members.length > 0
                      ? `${members.length} published`
                      : "Profiles pending"}
                  </Badge>
                </span>
                <span className="mt-1.5 block text-[0.8125rem] text-fg-subtle">
                  {SEATS[chamber].unit}
                </span>
                <h2 className="mt-5 font-display text-xl leading-snug text-fg">
                  {chamberLabels[chamber]}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {chamberDescriptions[chamber]}
                </p>
                <span className="mt-auto pt-6 text-[0.8125rem] font-semibold text-ink-700 transition-colors group-hover:text-crimson-700">
                  View members →
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section tone="surface" ariaLabelledBy="all-representatives-heading">
        <SectionHeader
          as="h2"
          eyebrow="Published profiles"
          title={<span id="all-representatives-heading">All representatives</span>}
          description="Every published representative across the three chambers."
        />

        {totalPublished > 0 ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {chambers.flatMap(({ chamber, members }) =>
              members.map((member) => (
                <li key={member.slug}>
                  <PersonCard
                    person={member}
                    href={`/representatives/${chamber}/${member.slug}`}
                    context={chamberLabels[chamber]}
                  />
                </li>
              )),
            )}
          </ul>
        ) : (
          <AwaitingRecordsState
            className="mt-10"
            what="Representative profiles"
            dataFile="src/data/people.ts"
          />
        )}
      </Section>
    </>
  );
}
