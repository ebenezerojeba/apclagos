import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { CouncilDirectory } from "@/components/directories/CouncilDirectory";
import { JsonLd } from "@/components/ui/primitives";
import { getChairmenByCouncil, getLgas } from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Local Government Areas of Lagos State",
  description:
    "The 20 constitutionally recognised Local Government Areas of Lagos State, with their LCDAs, wards, constituencies and council leadership.",
  path: "/lgas",
  keywords: ["Lagos LGAs", "20 local government areas Lagos", "Lagos LGA chairmen"],
});

export default async function LgasPage() {
  const [lgas, chairmen] = await Promise.all([getLgas(), getChairmenByCouncil()]);
  const lgaOptions = lgas.map((lga) => ({ value: lga.slug, label: lga.name }));

  return (
    <>
      <PageHeader
        eyebrow="Local government"
        title="Local Government Areas"
        description="Lagos State has 20 Local Government Areas recognised in the Constitution of the Federal Republic of Nigeria. Each is further divided into Local Council Development Areas and wards, and each returns two members to the State House of Assembly."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
          { name: "LGAs", href: "/lgas" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Local Government Areas", value: lgas.length },
            { label: "State constituencies", value: 40 },
            { label: "Federal constituencies", value: 24 },
            { label: "Senatorial districts", value: 3 },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        <JsonLd
          data={itemListJsonLd({
            name: "Local Government Areas of Lagos State",
            items: lgas.map((lga) => ({ name: lga.name, href: `/lgas/${lga.slug}` })),
          })}
        />
        <CouncilDirectory
          councils={lgas}
          chairmen={chairmen}
          lgaOptions={lgaOptions}
          lockType="LGA"
        />
      </Section>
    </>
  );
}
