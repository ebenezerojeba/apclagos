import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card, Badge, JsonLd } from "@/components/ui/primitives";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { SmartImage, SIZES } from "@/components/ui/Media";
import { GalleryCard, EventCard } from "@/components/cards/ContentCards";
import { ShareRow } from "@/components/ui/ShareRow";
import { Button } from "@/components/ui/Button";
import {
  getEventBySlug,
  getEvents,
  getGalleryAlbumBySlug,
  getUpcomingEvents,
} from "@/lib/content";
import { buildMetadata, eventJsonLd } from "@/lib/seo";
import { formatDate, formatTime, isPast } from "@/lib/format";
import { eventCategoryLabels } from "@/lib/labels";

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };

  return buildMetadata({
    title: event.title,
    description: event.summary,
    path: `/events/${event.slug}`,
    image: event.cover?.src,
    imageAlt: event.cover?.alt,
    type: "article",
    publishedTime: event.createdAt,
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [album, otherEvents] = await Promise.all([
    event.galleryAlbumSlug
      ? getGalleryAlbumBySlug(event.galleryAlbumSlug)
      : Promise.resolve(undefined),
    getUpcomingEvents(4),
  ]);

  const related = otherEvents.filter((item) => item.slug !== event.slug).slice(0, 3);
  const past = isPast(event.endsAt ?? event.startsAt);

  return (
    <>
      <JsonLd
        data={eventJsonLd({
          name: event.title,
          description: event.summary,
          path: `/events/${event.slug}`,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          image: event.cover?.src,
        })}
      />

      <PageHeader
        eyebrow={eventCategoryLabels[event.category]}
        title={event.title}
        description={event.summary}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
          { name: event.title, href: `/events/${event.slug}` },
        ]}
        aside={
          event.registrationUrl && !past ? (
            <Button
              href={event.registrationUrl}
              variant="inverse"
              iconRight={<Ticket className="size-4" />}
            >
              Register
            </Button>
          ) : null
        }
      >
        <div className="flex flex-wrap items-center gap-2 border-t border-white/12 pt-6">
          {past ? <Badge tone="inverse">Past event</Badge> : null}
          {event.notice ? <Badge tone="crimson">{event.notice}</Badge> : null}
        </div>
      </PageHeader>

      <Section tone="canvas">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-16">
          <div>
            {event.cover ? (
              <SmartImage
                image={event.cover}
                aspect="event"
                sizes={SIZES.feature}
                priority
                className="rounded-2xl shadow-[var(--shadow-card)]"
              />
            ) : null}

            {event.description?.length ? (
              <ArticleBody blocks={event.description} className="mt-10 max-w-3xl" />
            ) : (
              <p className="mt-10 max-w-3xl text-base leading-relaxed text-fg-muted">
                {event.summary}
              </p>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card className="p-6">
              <h2 className="font-display text-lg text-fg">Event details</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-brass-500" aria-hidden="true" />
                  <div>
                    <dt className="text-fg-subtle">Date</dt>
                    <dd className="tnum mt-0.5 font-medium text-fg">
                      <time dateTime={event.startsAt}>
                        {formatDate(event.startsAt)}
                      </time>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-brass-500" aria-hidden="true" />
                  <div>
                    <dt className="text-fg-subtle">Time (WAT)</dt>
                    <dd className="tnum mt-0.5 font-medium text-fg">
                      <time dateTime={event.startsAt}>{formatTime(event.startsAt)}</time>
                      {event.endsAt ? (
                        <>
                          {" – "}
                          <time dateTime={event.endsAt}>{formatTime(event.endsAt)}</time>
                        </>
                      ) : null}
                    </dd>
                  </div>
                </div>
                {event.venueName ? (
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brass-500" aria-hidden="true" />
                    <div>
                      <dt className="text-fg-subtle">Venue</dt>
                      <dd className="mt-0.5 font-medium text-fg">{event.venueName}</dd>
                      {event.venueAddress ? (
                        <dd className="mt-0.5 text-fg-muted">{event.venueAddress}</dd>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </dl>

              {event.registrationUrl && !past ? (
                <Button
                  href={event.registrationUrl}
                  variant="secondary"
                  fullWidth
                  className="mt-6"
                >
                  Register or request information
                </Button>
              ) : null}
            </Card>

            <h2 className="mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              Share this event
            </h2>
            <ShareRow
              className="mt-4"
              title={event.title}
              path={`/events/${event.slug}`}
            />
          </aside>
        </div>
      </Section>

      {album ? (
        <Section tone="surface" ariaLabelledBy="event-gallery-heading">
          <SectionHeader
            as="h2"
            eyebrow="Media"
            title={<span id="event-gallery-heading">Photographs from this event</span>}
          />
          <div className="mt-10 max-w-sm">
            <GalleryCard album={album} />
          </div>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section tone="canvas" ariaLabelledBy="other-events-heading">
          <SectionHeader
            as="h2"
            eyebrow="Calendar"
            title={<span id="other-events-heading">Other upcoming events</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <EventCard event={item} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
