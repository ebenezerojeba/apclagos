import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { CouncilProfile } from "@/components/sections/CouncilProfile";
import { Button } from "@/components/ui/Button";
import {
  getAchievements,
  getCouncilOfficials,
  getFederalConstituencies,
  getGalleryAlbums,
  getLcdasForLga,
  getLgaBySlug,
  getLgas,
  getNews,
  getSenatorialDistricts,
  getStateConstituencies,
  getWards,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

/** Pre-render all 20 LGA pages at build time. */
export async function generateStaticParams() {
  const lgas = await getLgas();
  return lgas.map((lga) => ({ slug: lga.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lga = await getLgaBySlug(slug);
  if (!lga) return { title: "Local Government Area not found" };

  return buildMetadata({
    title: `${lga.name} Local Government Area`,
    description:
      lga.description?.[0] ??
      `${lga.name} Local Government Area, Lagos State — council leadership, LCDAs, wards and constituency information published by APC Lagos.`,
    path: `/lgas/${lga.slug}`,
    image: lga.cover?.src,
    keywords: [`${lga.name} LGA`, `${lga.name} Lagos`, "Lagos local government"],
  });
}

export default async function LgaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lga = await getLgaBySlug(slug);
  if (!lga) notFound();

  const [
    officials,
    childLcdas,
    wards,
    districts,
    federal,
    state,
    achievements,
    news,
    albums,
  ] = await Promise.all([
    getCouncilOfficials(lga.slug),
    getLcdasForLga(lga.slug),
    getWards(lga.slug),
    getSenatorialDistricts(),
    getFederalConstituencies(),
    getStateConstituencies(),
    getAchievements(),
    getNews(),
    getGalleryAlbums(),
  ]);

  const district = districts.find((d) => d.slug === lga.senatorialDistrictSlug);
  const federalForLga = federal.filter((f) =>
    lga.federalConstituencySlugs.includes(f.slug),
  );
  const stateForLga = state.filter((s) => s.lgaSlug === lga.slug);

  const councilAchievements = achievements.filter((a) => a.lgaSlug === lga.slug);
  const councilNews = news
    .filter((n) => n.relatedCouncilSlugs?.includes(lga.slug))
    .slice(0, 3);
  const councilAlbums = albums.filter((a) =>
    lga.galleryAlbumSlugs?.includes(a.slug),
  );

  return (
    <>
      <PageHeader
        eyebrow="Local Government Area"
        title={lga.name}
        description={
          lga.description?.[0] ??
          `${lga.name} is one of the 20 Local Government Areas of Lagos State. This page brings together its council leadership, the LCDAs carved out of it, its wards and the constituencies it falls within.`
        }
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
          { name: "LGAs", href: "/lgas" },
          { name: lga.name, href: `/lgas/${lga.slug}` },
        ]}
        aside={
          <Button href="/lgas" variant="inverse" size="sm">
            All LGAs
          </Button>
        }
      >
        <HeaderFacts
          items={[
            { label: "LCDAs", value: childLcdas.length },
            { label: "Wards", value: wards.length || lga.wardCount || "Pending" },
            { label: "State constituencies", value: stateForLga.length },
            {
              label: "Senatorial district",
              value: district?.name.replace(" Senatorial District", "") ?? "—",
            },
          ]}
        />
      </PageHeader>

      <CouncilProfile
        council={lga}
        officials={officials}
        childLcdas={childLcdas}
        wards={wards}
        constituencies={[
          {
            label: "Senatorial district",
            items: district ? [{ name: district.name, slug: district.slug }] : [],
          },
          {
            label: "Federal constituencies",
            items: federalForLga.map((f) => ({ name: f.name, slug: f.slug })),
          },
          {
            label: "State constituencies",
            items: stateForLga.map((s) => ({ name: s.name, slug: s.slug })),
          },
        ]}
        achievements={councilAchievements}
        news={councilNews}
        albums={councilAlbums}
      />
    </>
  );
}
