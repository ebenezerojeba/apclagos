import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card } from "@/components/ui/primitives";
import {
  StructureExplorer,
  type ExplorerLga,
} from "@/components/directories/StructureExplorer";
import {
  getFederalConstituencies,
  getLcdas,
  getLgas,
  getSenatorialDistricts,
  getStateConstituencies,
  getWards,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Political structure of APC Lagos",
  description:
    "Explore the party structure from the Lagos State chapter down through 20 Local Government Areas, 37 LCDAs, wards and constituencies.",
  path: "/structure",
  keywords: [
    "APC Lagos structure",
    "Lagos party hierarchy",
    "Lagos ward structure",
    "Lagos LGA LCDA ward",
  ],
});

const TIERS = [
  {
    tier: "Tier 1",
    name: "State chapter",
    description:
      "The state executive administers the party across Lagos, coordinates congresses and supervises every tier below it.",
  },
  {
    tier: "Tier 2",
    name: "Local Government Areas",
    description:
      "20 constitutionally recognised councils. Each has its own party structure and returns two members to the State House of Assembly.",
  },
  {
    tier: "Tier 3",
    name: "Local Council Development Areas",
    description:
      "37 councils created by the Lagos State Government from the 20 LGAs, bringing the total number of local councils to 57.",
  },
  {
    tier: "Tier 4",
    name: "Wards",
    description:
      "The base unit of the party. Congresses begin at ward level and every member is registered in one.",
  },
];

export default async function StructurePage() {
  const [lgas, lcdas, wards, districts, federal, state] = await Promise.all([
    getLgas(),
    getLcdas(),
    getWards(),
    getSenatorialDistricts(),
    getFederalConstituencies(),
    getStateConstituencies(),
  ]);

  const explorerLgas: ExplorerLga[] = lgas.map((lga) => {
    const district = districts.find((d) => d.slug === lga.senatorialDistrictSlug);
    return {
      slug: lga.slug,
      name: lga.name,
      districtName: district?.name ?? "—",
      districtSlug: district?.slug ?? "",
      lcdaSlugs: lga.lcdaSlugs,
      federalConstituencies: federal
        .filter((f) => lga.federalConstituencySlugs.includes(f.slug))
        .map((f) => ({ slug: f.slug, name: f.name })),
      stateConstituencies: state
        .filter((s) => s.lgaSlug === lga.slug)
        .map((s) => ({ slug: s.slug, name: s.name })),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="How the party is organised"
        title="Political structure"
        description="APC Lagos is organised in four tiers, from the state chapter down to the ward. Use the explorer to move through the hierarchy, or follow any tier through to its own directory."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Political Structure", href: "/structure" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Local Government Areas", value: lgas.length },
            { label: "LCDAs", value: lcdas.length },
            { label: "Total local councils", value: lgas.length + lcdas.length },
            { label: "Published wards", value: wards.length || "Pending" },
          ]}
        />
      </PageHeader>

      <Section tone="canvas" ariaLabelledBy="explorer-heading">
        <SectionHeader
          as="h2"
          eyebrow="Explorer"
          title={<span id="explorer-heading">Walk the hierarchy</span>}
          description="Select a senatorial district to narrow the local governments, then a local government to see its LCDAs, wards and constituencies."
          className="mb-10"
        />
        <StructureExplorer
          lgas={explorerLgas}
          lcdas={lcdas.map((lcda) => ({
            slug: lcda.slug,
            name: lcda.name,
            parentLgaSlug: lcda.parentLgaSlug,
          }))}
          wards={wards.map((ward) => ({
            slug: ward.slug,
            name: ward.name,
            code: ward.code,
            lgaSlug: ward.lgaSlug,
            lcdaSlug: ward.lcdaSlug,
          }))}
          districts={districts.map((district) => ({
            slug: district.slug,
            name: district.name,
            lgaSlugs: district.lgaSlugs,
          }))}
        />
      </Section>

      <Section tone="surface" ariaLabelledBy="tiers-heading">
        <SectionHeader
          as="h2"
          eyebrow="Reference"
          title={<span id="tiers-heading">The four tiers</span>}
          description="What each level of the structure does."
        />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <li key={tier.tier}>
              <Card className="h-full p-6">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-500">
                  {tier.tier}
                </p>
                <h3 className="mt-2 font-display text-lg leading-snug text-fg">
                  {tier.name}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {tier.description}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
