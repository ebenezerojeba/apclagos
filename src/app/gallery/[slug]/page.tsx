import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/ui/primitives";
import { AlbumGrid } from "@/components/directories/AlbumGrid";
import { GalleryCard } from "@/components/cards/ContentCards";
import { Button } from "@/components/ui/Button";
import { getGalleryAlbumBySlug, getGalleryAlbums } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { galleryCategoryLabels } from "@/lib/labels";

export async function generateStaticParams() {
  const albums = await getGalleryAlbums();
  return albums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);
  if (!album) return { title: "Album not found" };

  return buildMetadata({
    title: album.title,
    description:
      album.description ??
      `${album.images.length} photographs from ${album.title}, published by APC Lagos.`,
    path: `/gallery/${album.slug}`,
    image: (album.cover ?? album.images[0])?.src,
    imageAlt: (album.cover ?? album.images[0])?.alt,
  });
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);
  if (!album) notFound();

  const others = (await getGalleryAlbums())
    .filter((item) => item.slug !== album.slug)
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={galleryCategoryLabels[album.category]}
        title={album.title}
        description={album.description}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Gallery", href: "/gallery" },
          { name: album.title, href: `/gallery/${album.slug}` },
        ]}
        aside={
          <Button href="/gallery" variant="inverse" size="sm">
            All albums
          </Button>
        }
      >
        <HeaderFacts
          items={[
            { label: "Photographs", value: album.images.length },
            {
              label: "Date",
              value: album.date ? formatDate(album.date, "medium") : "—",
            },
            { label: "Location", value: album.location ?? "—" },
            { label: "Category", value: galleryCategoryLabels[album.category] },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {album.images.length > 0 ? (
          <AlbumGrid images={album.images} albumTitle={album.title} />
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-paper-100/60 px-6 py-12 text-center text-sm text-fg-muted">
            This album does not contain any photographs yet.
          </p>
        )}
      </Section>

      {others.length > 0 ? (
        <Section tone="surface" ariaLabelledBy="other-albums-heading">
          <SectionHeader
            as="h2"
            eyebrow="Media library"
            title={<span id="other-albums-heading">More albums</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <li key={item.slug}>
                <GalleryCard album={item} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
