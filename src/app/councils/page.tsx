import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { CouncilDirectory } from "@/components/directories/CouncilDirectory";
import { JsonLd } from "@/components/ui/primitives";
import { getChairmenByCouncil, getCouncils, getLgas } from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Local Councils — all 57 LGAs and LCDAs",
  description:
    "Search every local council in Lagos State: 20 Local Government Areas and 37 Local Council Development Areas, with chairmen, wards and council information.",
  path: "/councils",
  keywords: [
    "Lagos local councils",
    "57 LCDAs Lagos",
    "Lagos LGA list",
    "Lagos LCDA chairmen",
  ],
});

export default async function CouncilsPage() {
  const [councils, chairmen, lgas] = await Promise.all([
    getCouncils(),
    getChairmenByCouncil(),
    getLgas(),
  ]);

  const lgaOptions = lgas.map((lga) => ({ value: lga.slug, label: lga.name }));

  return (
    <>
      <PageHeader
        eyebrow="Local government"
        title="All 57 local councils"
        description="Lagos State is administered through 20 constitutionally recognised Local Government Areas and 37 Local Council Development Areas created by the state. Search by council or chairman, filter by local government, or browse alphabetically."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Total councils", value: councils.length },
            { label: "Local Government Areas", value: lgas.length },
            { label: "LCDAs", value: councils.length - lgas.length },
            { label: "Senatorial districts", value: 3 },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        <JsonLd
          data={itemListJsonLd({
            name: "Local councils of Lagos State",
            items: councils.map((council) => ({
              name: council.name,
              href: `/${council.councilType === "LGA" ? "lgas" : "lcdas"}/${council.slug}`,
            })),
          })}
        />
        <CouncilDirectory
          councils={councils}
          chairmen={chairmen}
          lgaOptions={lgaOptions}
        />
      </Section>
    </>
  );
}
