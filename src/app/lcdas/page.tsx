import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { CouncilDirectory } from "@/components/directories/CouncilDirectory";
import { JsonLd } from "@/components/ui/primitives";
import { getChairmenByCouncil, getLcdas, getLgas } from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Local Council Development Areas (LCDAs)",
  description:
    "The 37 Local Council Development Areas of Lagos State, with their parent local governments, chairmen, wards and council information.",
  path: "/lcdas",
  keywords: [
    "Lagos LCDAs",
    "37 LCDAs Lagos State",
    "LCDA chairmen Lagos",
    "Local Council Development Area",
  ],
});

export default async function LcdasPage() {
  const [lcdas, lgas, chairmen] = await Promise.all([
    getLcdas(),
    getLgas(),
    getChairmenByCouncil(),
  ]);
  const lgaOptions = lgas.map((lga) => ({ value: lga.slug, label: lga.name }));

  return (
    <>
      <PageHeader
        eyebrow="Local government"
        title="Local Council Development Areas"
        description="Lagos State created 37 Local Council Development Areas from its 20 Local Government Areas, bringing the total number of local councils in the state to 57. Filter by parent local government to see how each LGA is subdivided."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
          { name: "LCDAs", href: "/lcdas" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "LCDAs", value: lcdas.length },
            { label: "Parent LGAs", value: lgas.length },
            { label: "Total local councils", value: lcdas.length + lgas.length },
            { label: "Senatorial districts", value: 3 },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        <JsonLd
          data={itemListJsonLd({
            name: "Local Council Development Areas of Lagos State",
            items: lcdas.map((lcda) => ({
              name: lcda.name,
              href: `/lcdas/${lcda.slug}`,
            })),
          })}
        />
        <CouncilDirectory
          councils={lcdas}
          chairmen={chairmen}
          lgaOptions={lgaOptions}
          lockType="LCDA"
        />
      </Section>
    </>
  );
}
