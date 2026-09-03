import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { PersonDirectory } from "@/components/directories/PersonDirectory";
import { JsonLd } from "@/components/ui/primitives";
import { getLeaders } from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { leadershipBodyLabels, optionsFrom } from "@/lib/labels";
import type { LeadershipBody } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Leadership of APC Lagos",
  description:
    "The state executive, working committee and leadership organs of the All Progressives Congress, Lagos State Chapter.",
  path: "/leadership",
  keywords: [
    "APC Lagos leadership",
    "APC Lagos state chairman",
    "APC Lagos state executive",
  ],
});

export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const leaders = await getLeaders();
  // The mega menu links straight to a filtered view, e.g. ?body=state-executive
  const initialBody =
    typeof params.body === "string" &&
    Object.keys(leadershipBodyLabels).includes(params.body)
      ? params.body
      : "";
  const bodies = leaders.map((l) => l.body) as LeadershipBody[];

  return (
    <>
      <PageHeader
        eyebrow="Party leadership"
        title="Leadership of APC Lagos"
        description="The officers of the state chapter and the organs through which the party is administered across Lagos State. Profiles are published as the party supplies them."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Leadership", href: "/leadership" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Published profiles", value: leaders.length },
            {
              label: "Leadership organs",
              value: new Set(bodies).size || "—",
            },
            { label: "Local councils", value: 57 },
            { label: "Senatorial districts", value: 3 },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {leaders.length > 0 ? (
          <JsonLd
            data={itemListJsonLd({
              name: "APC Lagos leadership",
              items: leaders.map((leader) => ({
                name: leader.name,
                href: `/leadership/${leader.slug}`,
              })),
            })}
          />
        ) : null}

        <PersonDirectory
          rows={leaders.map((leader) => ({
            person: leader,
            href: `/leadership/${leader.slug}`,
            context: leadershipBodyLabels[leader.body],
          }))}
          initialFacetValues={initialBody ? { body: initialBody } : undefined}
          noun="profile"
          emptyWhat="Leadership profiles"
          facets={[
            {
              id: "body",
              label: "Leadership organ",
              display: "chips",
              field: "body",
              allLabel: "All organs",
              options: optionsFrom(leadershipBodyLabels, bodies),
            },
          ]}
        />
      </Section>
    </>
  );
}
