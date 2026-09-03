import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card, DataList, Badge } from "@/components/ui/primitives";
import { PersonCard } from "@/components/cards/PersonCard";
import { CouncilRow } from "@/components/cards/CouncilCard";
import {
  AchievementCard,
  GalleryCard,
  NewsCard,
} from "@/components/cards/ContentCards";
import { EmptyState } from "@/components/ui/states";
import type {
  Achievement,
  Council,
  CouncilOfficial,
  GalleryAlbum,
  LocalCouncilDevelopmentArea,
  NewsArticle,
  Ward,
} from "@/types/content";

/**
 * The body of an LGA or LCDA page.
 *
 * Both tiers share one presentation so a visitor moving between them never has
 * to re-learn the layout. Sections that have no records yet are replaced with a
 * short, honest pending note rather than being dropped silently.
 */
export function CouncilProfile({
  council,
  officials,
  childLcdas,
  parentName,
  wards,
  constituencies,
  achievements,
  news,
  albums,
}: {
  council: Council;
  officials: CouncilOfficial[];
  childLcdas?: LocalCouncilDevelopmentArea[];
  parentName?: string;
  wards: Ward[];
  constituencies: { label: string; items: { name: string; slug: string }[] }[];
  achievements: Achievement[];
  news: NewsArticle[];
  albums: GalleryAlbum[];
}) {
  const chairman = officials.find((o) => o.councilRole === "Chairman");
  const otherOfficials = officials.filter((o) => o !== chairman);
  const isLga = council.councilType === "LGA";

  return (
    <>
      {/* Officials */}
      <Section tone="canvas" ariaLabelledBy="officials-heading">
        <SectionHeader
          as="h2"
          eyebrow="Council leadership"
          title={<span id="officials-heading">Officials of {council.name}</span>}
          description={`Office holders published for this ${isLga ? "Local Government Area" : "Local Council Development Area"}.`}
        />

        {officials.length > 0 ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[chairman, ...otherOfficials]
              .filter((o): o is CouncilOfficial => Boolean(o))
              .map((official) => (
                <li key={official.slug}>
                  <PersonCard
                    person={official}
                    href={`/${isLga ? "lgas" : "lcdas"}/${council.slug}#${official.slug}`}
                    context={official.councilRole}
                  />
                </li>
              ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-10"
            title="Council officials have not been published yet"
            description={
              <>
                The chairman and supporting officials for {council.name} will
                appear here once the party supplies their names, offices and
                photographs. Nothing on this page is generated or assumed.
              </>
            }
          />
        )}
      </Section>

      {/* Structure */}
      <Section tone="surface" ariaLabelledBy="council-structure-heading">
        <SectionHeader
          as="h2"
          eyebrow="Structure"
          title={<span id="council-structure-heading">Political structure</span>}
          description={
            isLga
              ? "The LCDAs carved out of this local government, its wards, and the constituencies it falls within."
              : "The parent local government, wards and constituencies this council falls within."
          }
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {isLga && childLcdas ? (
            <Card className="p-6 lg:p-7">
              <h3 className="font-display text-lg text-fg">
                Local Council Development Areas
              </h3>
              {childLcdas.length > 0 ? (
                <ul className="mt-4">
                  {childLcdas.map((lcda) => (
                    <CouncilRow key={lcda.slug} council={lcda} />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-fg-muted">
                  No LCDAs were carved out of this local government.
                </p>
              )}
            </Card>
          ) : parentName ? (
            <Card className="p-6 lg:p-7">
              <h3 className="font-display text-lg text-fg">Parent local government</h3>
              <p className="mt-4">
                <Link
                  href={`/lgas/${(council as LocalCouncilDevelopmentArea).parentLgaSlug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-800 transition-colors hover:border-ink-400"
                >
                  {parentName}
                  <Badge tone="ink">LGA</Badge>
                </Link>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                {council.name} is a Local Council Development Area within{" "}
                {parentName} Local Government Area.
              </p>
            </Card>
          ) : null}

          <Card className="p-6 lg:p-7">
            <h3 className="font-display text-lg text-fg">Wards</h3>
            {wards.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {wards.map((ward) => (
                  <li key={ward.slug}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-paper-100 px-3 py-1.5 text-[0.8125rem] text-fg-muted">
                      {ward.code ? (
                        <span className="tnum font-semibold text-ink-700">{ward.code}</span>
                      ) : null}
                      {ward.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                Ward delimitation for this council has not been published yet.
                Ward records are loaded from{" "}
                <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                  src/data/resources.ts
                </code>
                .
              </p>
            )}
          </Card>

          <Card className="p-6 lg:p-7">
            <h3 className="font-display text-lg text-fg">Constituencies</h3>
            <div className="mt-4 space-y-5">
              {constituencies.map((group) => (
                <div key={group.label}>
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                    {group.label}
                  </p>
                  {group.items.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {group.items.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/constituencies#${item.slug}`}
                            className="text-sm text-ink-800 underline-offset-4 hover:underline"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-fg-subtle">—</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* Contact + description */}
      {council.description?.length || council.contact ? (
        <Section tone="canvas" ariaLabelledBy="council-about-heading">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <SectionHeader
                as="h2"
                eyebrow="About"
                title={<span id="council-about-heading">About {council.name}</span>}
              />
              {council.description?.length ? (
                <div className="prose-institutional mt-8">
                  {council.description.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </div>

            {council.contact ? (
              <Card className="h-fit p-6 lg:p-7">
                <h3 className="font-display text-lg text-fg">Council contact</h3>
                <div className="mt-5 space-y-4 text-sm">
                  {council.contact.addressLines?.length ? (
                    <p className="flex gap-3 text-fg-muted">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brass-500" aria-hidden="true" />
                      <span>
                        {council.contact.addressLines.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </span>
                    </p>
                  ) : null}
                  {council.contact.phones?.map((phone) => (
                    <p key={phone} className="flex items-center gap-3">
                      <Phone className="size-4 shrink-0 text-brass-500" aria-hidden="true" />
                      <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-ink-800 hover:underline">
                        {phone}
                      </a>
                    </p>
                  ))}
                  {council.contact.emails?.map((email) => (
                    <p key={email} className="flex items-center gap-3">
                      <Mail className="size-4 shrink-0 text-brass-500" aria-hidden="true" />
                      <a href={`mailto:${email}`} className="break-all text-ink-800 hover:underline">
                        {email}
                      </a>
                    </p>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* Achievements */}
      {achievements.length > 0 ? (
        <Section tone="muted" ariaLabelledBy="council-achievements-heading">
          <SectionHeader
            as="h2"
            eyebrow="Delivery"
            title={<span id="council-achievements-heading">Projects and achievements</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <li key={achievement.slug}>
                <AchievementCard achievement={achievement} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* News */}
      {news.length > 0 ? (
        <Section tone="surface" ariaLabelledBy="council-news-heading">
          <SectionHeader
            as="h2"
            eyebrow="Newsroom"
            title={<span id="council-news-heading">News from {council.name}</span>}
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

      {/* Gallery */}
      {albums.length > 0 ? (
        <Section tone="canvas" ariaLabelledBy="council-gallery-heading">
          <SectionHeader
            as="h2"
            eyebrow="Media"
            title={<span id="council-gallery-heading">Photo gallery</span>}
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

/** Facts strip shown inside a council page header. */
export function councilFacts(input: {
  council: Council;
  parentName?: string;
  districtName?: string;
  lcdaCount?: number;
  wardCount?: number;
}) {
  const { council, parentName, districtName, lcdaCount, wardCount } = input;
  const facts: { label: string; value: React.ReactNode }[] = [
    { label: "Tier", value: council.councilType },
  ];

  if (council.councilType === "LGA") {
    facts.push({ label: "LCDAs", value: lcdaCount ?? council.lcdaSlugs.length });
  } else if (parentName) {
    facts.push({ label: "Parent LGA", value: parentName });
  }

  facts.push({ label: "Wards", value: wardCount || "Pending" });
  if (districtName) facts.push({ label: "Senatorial district", value: districtName });

  return facts;
}

export { DataList };
