import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/ui/primitives";
import { EventCard } from "@/components/cards/ContentCards";
import { AwaitingRecordsState } from "@/components/ui/states";
import { StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import { getEvents, getPastEvents, getUpcomingEvents } from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/primitives";

export const metadata: Metadata = buildMetadata({
  title: "Events",
  description:
    "Congresses, rallies, stakeholder meetings, town halls and party activities organised by APC Lagos across the state.",
  path: "/events",
  keywords: ["APC Lagos events", "APC Lagos congress", "Lagos party rally"],
});

export default async function EventsPage() {
  const [all, upcoming, past] = await Promise.all([
    getEvents(),
    getUpcomingEvents(),
    getPastEvents(9),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Events"
        description="Congresses, stakeholder meetings, town halls, commissioning ceremonies and party activities across Lagos State."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Events", href: "/events" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Upcoming", value: upcoming.length },
            { label: "Past events", value: all.length - upcoming.length },
            { label: "Total published", value: all.length },
            { label: "Local councils", value: 57 },
          ]}
        />
      </PageHeader>

      <Section tone="canvas" ariaLabelledBy="upcoming-events-heading">
        <SectionHeader
          as="h2"
          eyebrow="Coming up"
          title={<span id="upcoming-events-heading">Upcoming events</span>}
          description="Times shown are West Africa Time (WAT)."
        />

        {all.length === 0 ? (
          <AwaitingRecordsState
            className="mt-10"
            what="Events"
            dataFile="src/data/editorial.ts"
          />
        ) : upcoming.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-paper-100/60 px-6 py-10 text-center text-sm text-fg-muted">
            No upcoming events are scheduled. Past events are listed below.
          </p>
        ) : (
          <>
            <JsonLd
              data={itemListJsonLd({
                name: "Upcoming APC Lagos events",
                items: upcoming.map((event) => ({
                  name: event.title,
                  href: `/events/${event.slug}`,
                })),
              })}
            />
            <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, index) => (
                <StaggerItem key={event.slug}>
                  <EventCard event={event} priority={index < 3} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </>
        )}
      </Section>

      {past.length > 0 ? (
        <Section tone="surface" ariaLabelledBy="past-events-heading">
          <SectionHeader
            as="h2"
            eyebrow="Archive"
            title={<span id="past-events-heading">Past events</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <li key={event.slug}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
