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
  getLcdaBySlug,
  getLcdas,
  getLgaBySlug,
  getNews,
  getSenatorialDistricts,
  getStateConstituencies,
  getWards,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

/** Pre-render all 37 LCDA pages at build time. */
export async function generateStaticParams() {
  const lcdas = await getLcdas();
  return lcdas.map((lcda) => ({ slug: lcda.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lcda = await getLcdaBySlug(slug);
  if (!lcda) return { title: "LCDA not found" };

  const parent = await getLgaBySlug(lcda.parentLgaSlug);

  return buildMetadata({
    title: `${lcda.name} LCDA`,
    description:
      lcda.description?.[0] ??
      `${lcda.name} Local Council Development Area${parent ? `, ${parent.name} LGA` : ""}, Lagos State — council leadership, wards and constituency information published by APC Lagos.`,
    path: `/lcdas/${lcda.slug}`,
    image: lcda.cover?.src,
    keywords: [
      `${lcda.name} LCDA`,
      `${lcda.name} Lagos`,
      "Local Council Development Area",
    ],
  });
}

export default async function LcdaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lcda = await getLcdaBySlug(slug);
  if (!lcda) notFound();

  const [
    parent,
    officials,
    wards,
    districts,
    federal,
    state,
    achievements,
    news,
    albums,
  ] = await Promise.all([
    getLgaBySlug(lcda.parentLgaSlug),
    getCouncilOfficials(lcda.slug),
    getWards(lcda.parentLgaSlug),
    getSenatorialDistricts(),
    getFederalConstituencies(),
    getStateConstituencies(),
    getAchievements(),
    getNews(),
    getGalleryAlbums(),
  ]);

  const lcdaWards = wards.filter((w) => w.lcdaSlug === lcda.slug);
  const district = parent
    ? districts.find((d) => d.slug === parent.senatorialDistrictSlug)
    : undefined;
  const federalForParent = parent
    ? federal.filter((f) => parent.federalConstituencySlugs.includes(f.slug))
    : [];
  const stateForParent = parent
    ? state.filter((s) => s.lgaSlug === parent.slug)
    : [];

  const councilAchievements = achievements.filter(
    (a) => a.lgaSlug === lcda.parentLgaSlug,
  );
  const councilNews = news
    .filter((n) => n.relatedCouncilSlugs?.includes(lcda.slug))
    .slice(0, 3);
  const councilAlbums = albums.filter((a) =>
    lcda.galleryAlbumSlugs?.includes(a.slug),
  );

  return (
    <>
      <PageHeader
        eyebrow="Local Council Development Area"
        title={lcda.name}
        description={
          lcda.description?.[0] ??
          `${lcda.name} is a Local Council Development Area${parent ? ` within ${parent.name} Local Government Area` : ""}. This page brings together its council leadership, wards and the constituencies it falls within.`
        }
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
          { name: "LCDAs", href: "/lcdas" },
          { name: lcda.name, href: `/lcdas/${lcda.slug}` },
        ]}
        aside={
          <Button href="/lcdas" variant="inverse" size="sm">
            All LCDAs
          </Button>
        }
      >
        <HeaderFacts
          items={[
            { label: "Parent LGA", value: parent?.name ?? "—" },
            {
              label: "Wards",
              value: lcdaWards.length || lcda.wardCount || "Pending",
            },
            {
              label: "Senatorial district",
              value: district?.name.replace(" Senatorial District", "") ?? "—",
            },
            { label: "Tier", value: "LCDA" },
          ]}
        />
      </PageHeader>

      <CouncilProfile
        council={lcda}
        officials={officials}
        parentName={parent?.name}
        wards={lcdaWards}
        constituencies={[
          {
            label: "Senatorial district",
            items: district ? [{ name: district.name, slug: district.slug }] : [],
          },
          {
            label: "Federal constituencies",
            items: federalForParent.map((f) => ({ name: f.name, slug: f.slug })),
          },
          {
            label: "State constituencies",
            items: stateForParent.map((s) => ({ name: s.name, slug: s.slug })),
          },
        ]}
        achievements={councilAchievements}
        news={councilNews}
        albums={councilAlbums}
      />
    </>
  );
}
