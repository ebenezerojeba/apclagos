import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/PageHeader";
import { PersonProfile, personFacts } from "@/components/sections/PersonProfile";
import { JsonLd } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import {
  getGalleryAlbums,
  getLeaderBySlug,
  getLeaders,
  getNews,
} from "@/lib/content";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { leadershipBodyLabels } from "@/lib/labels";

export async function generateStaticParams() {
  const leaders = await getLeaders();
  return leaders.map((leader) => ({ slug: leader.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const leader = await getLeaderBySlug(slug);
  if (!leader) return { title: "Profile not found" };

  const name = [leader.honorific, leader.name].filter(Boolean).join(" ");

  return buildMetadata({
    title: `${name} — ${leader.position}`,
    description:
      leader.summary ??
      `${name}, ${leader.position}, All Progressives Congress, Lagos State Chapter.`,
    path: `/leadership/${leader.slug}`,
    image: leader.portrait?.src,
    imageAlt: leader.portrait?.alt,
    type: "profile",
  });
}

export default async function LeaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const leader = await getLeaderBySlug(slug);
  if (!leader) notFound();

  const [news, albums] = await Promise.all([getNews(), getGalleryAlbums()]);

  const relatedNews = news
    .filter((article) => article.relatedPersonSlugs?.includes(leader.slug))
    .slice(0, 3);
  const relatedAlbums = albums.filter((album) =>
    leader.galleryAlbumSlugs?.includes(album.slug),
  );

  const name = [leader.honorific, leader.name].filter(Boolean).join(" ");
  const fullName = leader.postNominals ? `${name}, ${leader.postNominals}` : name;

  return (
    <>
      <JsonLd
        data={personJsonLd({
          name: fullName,
          jobTitle: leader.position,
          description: leader.summary,
          image: leader.portrait?.src,
          path: `/leadership/${leader.slug}`,
        })}
      />

      <PageHeader
        eyebrow={leadershipBodyLabels[leader.body]}
        title={fullName}
        description={leader.position}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Leadership", href: "/leadership" },
          { name: leader.name, href: `/leadership/${leader.slug}` },
        ]}
        aside={
          <Button href="/leadership" variant="inverse" size="sm">
            All leadership
          </Button>
        }
      />

      <PersonProfile
        person={leader}
        facts={personFacts(leader, [
          { label: "Office", value: leader.position },
          { label: "Organ", value: leadershipBodyLabels[leader.body] },
          ...(leader.jurisdiction
            ? [{ label: "Jurisdiction", value: leader.jurisdiction }]
            : []),
        ])}
        news={relatedNews}
        albums={relatedAlbums}
      />
    </>
  );
}
