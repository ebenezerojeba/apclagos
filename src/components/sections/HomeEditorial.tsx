import { ArrowRight, CalendarDays, Images, Newspaper } from "lucide-react";
import { Section } from "@/components/sections/Section";
import { SectionHeader, ArrowLink } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import {
  EventCard,
  GalleryCard,
  NewsCard,
  VideoCard,
} from "@/components/cards/ContentCards";
import { AwaitingRecordsState } from "@/components/ui/states";
import { StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import {
  getFeaturedNews,
  getGalleryAlbums,
  getLatestNews,
  getUpcomingEvents,
  getVideos,
} from "@/lib/content";
import { siteContact } from "@/data/site";

/* -------------------------------------------------------------------------- */
/*  Newsroom                                                                   */
/* -------------------------------------------------------------------------- */

export async function NewsPreview() {
  const [featured, latest] = await Promise.all([
    getFeaturedNews(),
    getLatestNews(7),
  ]);

  const rest = latest.filter((article) => article.slug !== featured?.slug).slice(0, 4);

  return (
    <Section tone="surface" ariaLabelledBy="news-heading">
      <SectionHeader
        as="h2"
        eyebrow="Newsroom"
        title={<span id="news-heading">Latest from APC Lagos</span>}
        description="Announcements, statements and coverage from the state chapter, its councils and its representatives."
        action={
          <Button href="/news" variant="outline" iconRight={<Newspaper className="size-4" />}>
            All news
          </Button>
        }
      />

      {featured ? (
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-8">
          <NewsCard article={featured} layout="feature" priority />
          <div className="flex flex-col gap-4">
            {rest.length > 0 ? (
              rest.map((article) => (
                <NewsCard key={article.slug} article={article} layout="row" />
              ))
            ) : (
              <p className="text-sm text-fg-muted">
                More articles will appear here as they are published.
              </p>
            )}
            <ArrowLink href="/news?category=press-releases" className="mt-1">
              Press releases
            </ArrowLink>
          </div>
        </div>
      ) : (
        <AwaitingRecordsState
          variant="compact"
          className="mt-10"
          what="News articles"
          dataFile="src/data/editorial.ts"
        />
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Events                                                                     */
/* -------------------------------------------------------------------------- */

export async function EventsPreview() {
  const events = await getUpcomingEvents(3);

  return (
    <Section tone="canvas" ariaLabelledBy="events-heading">
      <SectionHeader
        as="h2"
        eyebrow="What is happening"
        title={<span id="events-heading">Upcoming events</span>}
        description="Congresses, stakeholder meetings, town halls and party activities across the state."
        action={
          <Button href="/events" variant="outline" iconRight={<CalendarDays className="size-4" />}>
            Full calendar
          </Button>
        }
      />

      {events.length > 0 ? (
        <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <StaggerItem key={event.slug}>
              <EventCard event={event} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <AwaitingRecordsState
          variant="compact"
          className="mt-10"
          what="Events"
          dataFile="src/data/editorial.ts"
        />
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Media                                                                      */
/* -------------------------------------------------------------------------- */

export async function MediaPreview() {
  const [albums, videos] = await Promise.all([getGalleryAlbums(), getVideos()]);

  const hasMedia = albums.length > 0 || videos.length > 0;

  return (
    <Section tone="surface" ariaLabelledBy="media-heading">
      <SectionHeader
        as="h2"
        eyebrow="Media library"
        title={<span id="media-heading">Photographs and video</span>}
        description="Albums from party events and campaigns, alongside speeches, interviews and recorded activities."
        action={
          <Button href="/gallery" variant="outline" iconRight={<Images className="size-4" />}>
            Open the gallery
          </Button>
        }
      />

      {hasMedia ? (
        <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {albums.slice(0, 2).map((album) => (
            <StaggerItem key={album.slug}>
              <GalleryCard album={album} />
            </StaggerItem>
          ))}
          {videos.slice(0, 2).map((video) => (
            <StaggerItem key={video.slug}>
              <VideoCard video={video} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <AwaitingRecordsState
          variant="compact"
          className="mt-10"
          what="Photographs and video"
          dataFile="src/data/media.ts"
        />
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Closing call to action                                                     */
/* -------------------------------------------------------------------------- */

export function ContactCta() {
  return (
    <Section tone="ink" size="lg" ariaLabelledBy="contact-cta-heading" grain>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="max-w-2xl">
          <p className="eyebrow text-brass-300">
            <span aria-hidden="true" className="h-px w-8 bg-brass-400" />
            Get in touch
          </p>
          <h2
            id="contact-cta-heading"
            className="mt-4 text-display-lg leading-[1.05] text-white"
          >
            Enquiries, membership and media
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-200">
            Reach the state secretariat for party enquiries, membership questions
            or media requests. Correspondence is directed to the relevant office.
          </p>
          {siteContact.emails?.[0] ? (
            <p className="mt-6 font-display text-2xl text-white">
              <a
                href={`mailto:${siteContact.emails[0]}`}
                className="on-ink underline decoration-brass-400/60 underline-offset-[6px] transition-colors hover:decoration-brass-300"
              >
                {siteContact.emails[0]}
              </a>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button href="/contact" variant="inverse" size="lg" iconRight={<ArrowRight className="size-4" />}>
            Contact the secretariat
          </Button>
          <Button
            href="/about"
            size="lg"
            variant="ghost"
            className="on-ink border border-white/25 text-white hover:bg-white/10"
          >
            About APC Lagos
          </Button>
        </div>
      </div>
    </Section>
  );
}
