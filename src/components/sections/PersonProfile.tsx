import Link from "next/link";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card, DataList, Badge } from "@/components/ui/primitives";
import { Portrait, SIZES } from "@/components/ui/Media";
import { SocialRow } from "@/components/layout/SocialRow";
import { GalleryCard, NewsCard } from "@/components/cards/ContentCards";
import { formatDate } from "@/lib/format";
import type { GalleryAlbum, NewsArticle, Person } from "@/types/content";

/**
 * The profile body shared by leaders, representatives and candidates.
 *
 * Optional sections disappear entirely when the party has not supplied that
 * information — a profile with only a name and an office still reads as a
 * finished page rather than a form full of blanks.
 */
export function PersonProfile({
  person,
  facts,
  extraSections,
  news,
  albums,
}: {
  person: Person;
  facts: { label: string; value: React.ReactNode; note?: string }[];
  /** Rendered between the biography and the related content. */
  extraSections?: React.ReactNode;
  news?: NewsArticle[];
  albums?: GalleryAlbum[];
}) {
  const listSections: { title: string; items?: string[] }[] = [
    { title: "Political experience", items: person.careerHighlights },
    { title: "Previous positions", items: person.previousPositions },
    { title: "Committees", items: person.committees },
    { title: "Education", items: person.education },
  ].filter((section) => section.items && section.items.length > 0);

  return (
    <>
      <Section tone="canvas" ariaLabelledBy="profile-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          {/* Portrait column */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[var(--shadow-card)]">
              <Portrait
                image={person.portrait}
                name={person.name}
                aspect="portrait"
                sizes={SIZES.portrait}
                priority
                zoomOnHover={false}
              />
              <div className="p-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  {person.shortPosition ?? person.position}
                </p>
                {person.jurisdiction ? (
                  <p className="mt-1 text-sm text-fg-muted">{person.jurisdiction}</p>
                ) : null}
                {person.social ? (
                  <SocialRow
                    social={person.social}
                    className="mt-4"
                    personName={person.name}
                  />
                ) : null}
              </div>
            </div>

            {facts.length > 0 ? (
              <Card className="mt-5 p-5">
                <h2 className="font-display text-base text-fg">Key information</h2>
                <DataList items={facts} className="mt-2" />
              </Card>
            ) : null}
          </div>

          {/* Body column */}
          <div>
            <h2 id="profile-heading" className="sr-only">
              Profile of {person.name}
            </h2>

            {person.summary ? (
              <p className="font-display text-xl leading-relaxed text-fg sm:text-2xl">
                {person.summary}
              </p>
            ) : null}

            {person.biography?.length ? (
              <div className="prose-institutional mt-8">
                {person.biography.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-paper-100/60 p-6">
                <p className="text-sm leading-relaxed text-fg-muted">
                  A full biography for{" "}
                  {[person.honorific, person.name].filter(Boolean).join(" ")} has
                  not been published yet. Biographies are added to{" "}
                  <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                    src/data/people.ts
                  </code>{" "}
                  as the party supplies them.
                </p>
              </div>
            )}

            {listSections.length > 0 ? (
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {listSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-display text-lg text-fg">{section.title}</h3>
                    <ul className="mt-4 space-y-3">
                      {section.items!.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-brass-400"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {extraSections}

            {person.tags?.length ? (
              <ul className="mt-12 flex flex-wrap gap-2 border-t border-border-subtle pt-6">
                {person.tags.map((tag) => (
                  <li key={tag}>
                    <Badge tone="outline">{tag}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Section>

      {news && news.length > 0 ? (
        <Section tone="surface" ariaLabelledBy="profile-news-heading">
          <SectionHeader
            as="h2"
            eyebrow="Newsroom"
            title={<span id="profile-news-heading">Related news</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <li key={article.slug}>
                <NewsCard article={article} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {albums && albums.length > 0 ? (
        <Section tone="canvas" ariaLabelledBy="profile-gallery-heading">
          <SectionHeader
            as="h2"
            eyebrow="Media"
            title={<span id="profile-gallery-heading">Photo gallery</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <li key={album.slug}>
                <GalleryCard album={album} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

/** Builds the shared "Key information" rows from a person record. */
export function personFacts(person: Person, extra: { label: string; value: React.ReactNode }[] = []) {
  const facts: { label: string; value: React.ReactNode }[] = [...extra];

  if (person.tenureStart) {
    facts.push({
      label: "In office since",
      value: formatDate(person.tenureStart),
    });
  }
  if (person.tenureEnd) {
    facts.push({ label: "Until", value: formatDate(person.tenureEnd) });
  }
  if (person.contact?.emails?.[0]) {
    facts.push({
      label: "Email",
      value: (
        <a
          href={`mailto:${person.contact.emails[0]}`}
          className="break-all text-ink-800 underline-offset-4 hover:underline"
        >
          {person.contact.emails[0]}
        </a>
      ),
    });
  }
  if (person.contact?.phones?.[0]) {
    facts.push({
      label: "Telephone",
      value: (
        <a
          href={`tel:${person.contact.phones[0].replace(/\s+/g, "")}`}
          className="text-ink-800 underline-offset-4 hover:underline"
        >
          {person.contact.phones[0]}
        </a>
      ),
    });
  }

  return facts;
}

/** Small helper for linking a jurisdiction back into the structure. */
export function JurisdictionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-ink-800 underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
