import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { MediaLibrary } from "@/components/directories/MediaLibrary";
import { AwaitingRecordsState } from "@/components/ui/states";
import { getGalleryAlbums } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { galleryCategoryLabels, optionsFrom } from "@/lib/labels";
import type { GalleryCategory } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Photo gallery",
  description:
    "Photographs from APC Lagos congresses, campaigns, community activities and leadership engagements, organised into albums.",
  path: "/gallery",
  keywords: ["APC Lagos photos", "APC Lagos gallery", "Lagos party photographs"],
});

export default async function GalleryPage() {
  const albums = await getGalleryAlbums();
  const categories = albums.map((a) => a.category) as GalleryCategory[];
  const totalImages = albums.reduce((sum, album) => sum + album.images.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Media library"
        title="Photo gallery"
        description="Albums from congresses, campaigns, commissioning ceremonies and community engagements across Lagos State."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Gallery", href: "/gallery" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Albums", value: albums.length },
            { label: "Photographs", value: totalImages },
            { label: "Categories", value: new Set(categories).size },
            { label: "Local councils", value: 57 },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {albums.length === 0 ? (
          <AwaitingRecordsState
            what="Photo albums"
            dataFile="src/data/media.ts"
          />
        ) : (
          <MediaLibrary
            items={albums}
            kind="album"
            categories={optionsFrom(galleryCategoryLabels, categories)}
          />
        )}
      </Section>
    </>
  );
}
