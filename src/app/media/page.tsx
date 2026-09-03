import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/ui/primitives";
import { MediaLibrary } from "@/components/directories/MediaLibrary";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { AwaitingRecordsState } from "@/components/ui/states";
import { getVideos } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { optionsFrom, videoCategoryLabels } from "@/lib/labels";
import type { VideoCategory } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Videos",
  description:
    "Speeches, interviews, campaign films and recorded party activities from APC Lagos.",
  path: "/media",
  keywords: ["APC Lagos videos", "APC Lagos speeches", "APC Lagos interviews"],
});

export default async function MediaPage() {
  const videos = await getVideos();
  const categories = videos.map((v) => v.category) as VideoCategory[];
  const featured = videos.find((v) => v.featured) ?? videos[0];

  return (
    <>
      <PageHeader
        eyebrow="Media library"
        title="Videos"
        description="Speeches, interviews, campaign films and recorded party activities. Embeds load only when you press play, so nothing is requested from a third party until you ask for it."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Videos", href: "/media" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Videos", value: videos.length },
            { label: "Categories", value: new Set(categories).size },
            { label: "Photo albums", value: "See gallery" },
            { label: "Press releases", value: "See newsroom" },
          ]}
        />
      </PageHeader>

      {videos.length === 0 ? (
        <Section tone="canvas">
          <AwaitingRecordsState what="Videos" dataFile="src/data/media.ts" />
        </Section>
      ) : (
        <>
          {featured ? (
            <Section tone="canvas" ariaLabelledBy="featured-video-heading">
              <SectionHeader
                as="h2"
                eyebrow="Featured"
                title={<span id="featured-video-heading">{featured.title}</span>}
                description={featured.description}
              />
              <div className="mt-8 max-w-4xl">
                <VideoPlayer embed={featured.embed} title={featured.title} />
              </div>
            </Section>
          ) : null}

          <Section tone="surface" ariaLabelledBy="video-library-heading">
            <SectionHeader
              as="h2"
              eyebrow="Library"
              title={<span id="video-library-heading">All videos</span>}
              className="mb-10"
            />
            <MediaLibrary
              items={videos}
              kind="video"
              categories={optionsFrom(videoCategoryLabels, categories)}
            />
          </Section>
        </>
      )}
    </>
  );
}
