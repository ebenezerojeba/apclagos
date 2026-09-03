import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/PageHeader";
import {
  JurisdictionLink,
  PersonProfile,
  personFacts,
} from "@/components/sections/PersonProfile";
import { JsonLd } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import {
  getFederalConstituencies,
  getGalleryAlbums,
  getNews,
  getRepresentatives,
  getSenatorialDistricts,
  getStateConstituencies,
} from "@/lib/content";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { chamberLabels } from "@/lib/labels";
import type { Chamber, Representative } from "@/types/content";

const CHAMBERS: Chamber[] = [
  "senate",
  "house-of-representatives",
  "house-of-assembly",
];

function isChamber(value: string): value is Chamber {
  return (CHAMBERS as string[]).includes(value);
}

function chamberOf(member: Representative): Chamber {
  if (member.kind === "senator") return "senate";
  if (member.kind === "house-of-representatives") return "house-of-representatives";
  return "house-of-assembly";
}

export async function generateStaticParams() {
  const members = await getRepresentatives();
  return members.map((member) => ({
    chamber: chamberOf(member),
    slug: member.slug,
  }));
}

async function findMember(chamber: string, slug: string) {
  if (!isChamber(chamber)) return undefined;
  const members = await getRepresentatives(chamber);
  return members.find((member) => member.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chamber: string; slug: string }>;
}): Promise<Metadata> {
  const { chamber, slug } = await params;
  const member = await findMember(chamber, slug);
  if (!member || !isChamber(chamber)) return { title: "Profile not found" };

  const name = [member.honorific, member.name].filter(Boolean).join(" ");

  return buildMetadata({
    title: `${name} — ${member.position}`,
    description:
      member.summary ??
      `${name}, ${member.position}${member.jurisdiction ? `, ${member.jurisdiction}` : ""}. Profile published by APC Lagos.`,
    path: `/representatives/${chamber}/${member.slug}`,
    image: member.portrait?.src,
    imageAlt: member.portrait?.alt,
    type: "profile",
  });
}

export default async function RepresentativePage({
  params,
}: {
  params: Promise<{ chamber: string; slug: string }>;
}) {
  const { chamber, slug } = await params;
  if (!isChamber(chamber)) notFound();

  const member = await findMember(chamber, slug);
  if (!member) notFound();

  const [districts, federal, state, news, albums] = await Promise.all([
    getSenatorialDistricts(),
    getFederalConstituencies(),
    getStateConstituencies(),
    getNews(),
    getGalleryAlbums(),
  ]);

  const district = districts.find((d) => d.slug === member.senatorialDistrictSlug);
  const federalConstituency = federal.find(
    (f) => f.slug === member.federalConstituencySlug,
  );
  const stateConstituency = state.find(
    (s) => s.slug === member.stateConstituencySlug,
  );

  const relatedNews = news
    .filter((article) => article.relatedPersonSlugs?.includes(member.slug))
    .slice(0, 3);
  const relatedAlbums = albums.filter((album) =>
    member.galleryAlbumSlugs?.includes(album.slug),
  );

  const name = [member.honorific, member.name].filter(Boolean).join(" ");
  const fullName = member.postNominals ? `${name}, ${member.postNominals}` : name;

  const extraFacts: { label: string; value: React.ReactNode }[] = [
    { label: "Chamber", value: chamberLabels[chamber] },
    { label: "Office", value: member.position },
  ];

  if (district) {
    extraFacts.push({
      label: "Senatorial district",
      value: (
        <JurisdictionLink href={`/constituencies#${district.slug}`}>
          {district.name}
        </JurisdictionLink>
      ),
    });
  }
  if (federalConstituency) {
    extraFacts.push({
      label: "Federal constituency",
      value: (
        <JurisdictionLink href={`/constituencies#${federalConstituency.slug}`}>
          {federalConstituency.name}
        </JurisdictionLink>
      ),
    });
  }
  if (stateConstituency) {
    extraFacts.push({
      label: "State constituency",
      value: (
        <JurisdictionLink href={`/constituencies#${stateConstituency.slug}`}>
          {stateConstituency.name}
        </JurisdictionLink>
      ),
    });
  }
  if (member.lgaSlug) {
    extraFacts.push({
      label: "Local government",
      value: (
        <JurisdictionLink href={`/lgas/${member.lgaSlug}`}>
          {member.lgaSlug.replace(/-/g, " ")}
        </JurisdictionLink>
      ),
    });
  }

  return (
    <>
      <JsonLd
        data={personJsonLd({
          name: fullName,
          jobTitle: member.position,
          description: member.summary,
          image: member.portrait?.src,
          path: `/representatives/${chamber}/${member.slug}`,
        })}
      />

      <PageHeader
        eyebrow={chamberLabels[chamber]}
        title={fullName}
        description={
          member.jurisdiction
            ? `${member.position} · ${member.jurisdiction}`
            : member.position
        }
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Representatives", href: "/representatives" },
          { name: chamberLabels[chamber], href: `/representatives/${chamber}` },
          {
            name: member.name,
            href: `/representatives/${chamber}/${member.slug}`,
          },
        ]}
        aside={
          <Button href={`/representatives/${chamber}`} variant="inverse" size="sm">
            All members
          </Button>
        }
      />

      <PersonProfile
        person={member}
        facts={personFacts(member, extraFacts)}
        news={relatedNews}
        albums={relatedAlbums}
      />
    </>
  );
}
