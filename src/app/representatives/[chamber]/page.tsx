import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { PersonDirectory, type PersonFacet } from "@/components/directories/PersonDirectory";
import { JsonLd } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import {
  getFederalConstituencies,
  getRepresentatives,
  getSenatorialDistricts,
  getStateConstituencies,
} from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { chamberDescriptions, chamberLabels } from "@/lib/labels";
import type { Chamber } from "@/types/content";

const CHAMBERS: Chamber[] = [
  "senate",
  "house-of-representatives",
  "house-of-assembly",
];

const SEAT_COUNTS: Record<Chamber, number> = {
  senate: 3,
  "house-of-representatives": 24,
  "house-of-assembly": 40,
};

function isChamber(value: string): value is Chamber {
  return (CHAMBERS as string[]).includes(value);
}

export function generateStaticParams() {
  return CHAMBERS.map((chamber) => ({ chamber }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chamber: string }>;
}): Promise<Metadata> {
  const { chamber } = await params;
  if (!isChamber(chamber)) return { title: "Chamber not found" };

  return buildMetadata({
    title: chamberLabels[chamber],
    description: chamberDescriptions[chamber],
    path: `/representatives/${chamber}`,
  });
}

export default async function ChamberPage({
  params,
}: {
  params: Promise<{ chamber: string }>;
}) {
  const { chamber } = await params;
  if (!isChamber(chamber)) notFound();

  const [members, districts, federal, state] = await Promise.all([
    getRepresentatives(chamber),
    getSenatorialDistricts(),
    getFederalConstituencies(),
    getStateConstituencies(),
  ]);

  const facets: PersonFacet[] = [];

  const districtFacet: PersonFacet = {
    id: "district",
    label: "Senatorial district",
    display: "chips",
    field: "senatorialDistrictSlug",
    allLabel: "All districts",
    options: districts.map((d) => ({
      value: d.slug,
      label: d.name.replace(" Senatorial District", ""),
      count: members.filter((m) => m.senatorialDistrictSlug === d.slug).length,
    })),
  };

  if (chamber === "senate") {
    facets.push(districtFacet);
  } else if (chamber === "house-of-representatives") {
    facets.push({
      id: "federal",
      label: "Federal constituency",
      display: "select",
      field: "federalConstituencySlug",
      allLabel: "All federal constituencies",
      options: federal.map((f) => ({
        value: f.slug,
        label: f.name.replace(" Federal Constituency", ""),
        count: members.filter((m) => m.federalConstituencySlug === f.slug).length,
      })),
    });
    facets.push(districtFacet);
  } else {
    facets.push({
      id: "state",
      label: "State constituency",
      display: "select",
      field: "stateConstituencySlug",
      allLabel: "All state constituencies",
      options: state.map((s) => ({
        value: s.slug,
        label: s.name,
        count: members.filter((m) => m.stateConstituencySlug === s.slug).length,
      })),
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Representation"
        title={chamberLabels[chamber]}
        description={chamberDescriptions[chamber]}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Representatives", href: "/representatives" },
          { name: chamberLabels[chamber], href: `/representatives/${chamber}` },
        ]}
        aside={
          <Button href="/representatives" variant="inverse" size="sm">
            All chambers
          </Button>
        }
      >
        <HeaderFacts
          items={[
            { label: "Seats", value: SEAT_COUNTS[chamber] },
            { label: "Published profiles", value: members.length },
            {
              label: "Awaiting publication",
              value: Math.max(0, SEAT_COUNTS[chamber] - members.length),
            },
            { label: "Senatorial districts", value: districts.length },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {members.length > 0 ? (
          <JsonLd
            data={itemListJsonLd({
              name: chamberLabels[chamber],
              items: members.map((member) => ({
                name: member.name,
                href: `/representatives/${chamber}/${member.slug}`,
              })),
            })}
          />
        ) : null}

        <PersonDirectory
          rows={members.map((member) => ({
            person: member,
            href: `/representatives/${chamber}/${member.slug}`,
            context: member.jurisdiction,
          }))}
          facets={facets}
          noun="representative"
          emptyWhat={`${chamberLabels[chamber]} profiles`}
          searchPlaceholder="Search name or constituency…"
        />
      </Section>
    </>
  );
}
