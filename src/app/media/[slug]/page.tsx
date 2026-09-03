import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { VideoCard } from "@/components/cards/ContentCards";
import { ShareRow } from "@/components/ui/ShareRow";
import { Button } from "@/components/ui/Button";
import { getVideoBySlug, getVideos } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { videoCategoryLabels } from "@/lib/labels";
import { youtubeThumbnail } from "@/lib/video";

export async function generateStaticParams() {
  const videos = await getVideos();
  return videos.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return { title: "Video not found" };

  const poster =
    video.embed.poster?.src ??
    (video.embed.provider === "youtube"
      ? youtubeThumbnail(video.embed.ref)
      : undefined);

  return buildMetadata({
    title: video.title,
    description:
      video.description ?? `${video.title} — video published by APC Lagos.`,
    path: `/media/${video.slug}`,
    image: poster,
    imageAlt: video.title,
  });
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) notFound();

  const others = (await getVideos())
    .filter((item) => item.slug !== video.slug)
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={videoCategoryLabels[video.category]}
        title={video.title}
        description={video.description}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Videos", href: "/media" },
          { name: video.title, href: `/media/${video.slug}` },
        ]}
        aside={
          <Button href="/media" variant="inverse" size="sm">
            All videos
          </Button>
        }
      />

      <Section tone="canvas">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-16">
          <div>
            <VideoPlayer embed={video.embed} title={video.title} />
            {video.description ? (
              <p className="mt-8 max-w-3xl text-base leading-relaxed text-fg-muted">
                {video.description}
              </p>
            ) : null}
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-fg-subtle">Category</dt>
                <dd className="mt-0.5 font-medium text-fg">
                  {videoCategoryLabels[video.category]}
                </dd>
              </div>
              {video.publishedAt ? (
                <div>
                  <dt className="text-fg-subtle">Published</dt>
                  <dd className="tnum mt-0.5 font-medium text-fg">
                    <time dateTime={video.publishedAt}>
                      {formatDate(video.publishedAt)}
                    </time>
                  </dd>
                </div>
              ) : null}
              {video.embed.duration ? (
                <div>
                  <dt className="text-fg-subtle">Duration</dt>
                  <dd className="tnum mt-0.5 font-medium text-fg">
                    {video.embed.duration}
                  </dd>
                </div>
              ) : null}
            </dl>

            <h2 className="mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              Share this video
            </h2>
            <ShareRow
              className="mt-4"
              title={video.title}
              path={`/media/${video.slug}`}
            />
          </aside>
        </div>
      </Section>

      {others.length > 0 ? (
        <Section tone="surface" ariaLabelledBy="more-videos-heading">
          <SectionHeader
            as="h2"
            eyebrow="Media library"
            title={<span id="more-videos-heading">More videos</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <li key={item.slug}>
                <VideoCard video={item} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
