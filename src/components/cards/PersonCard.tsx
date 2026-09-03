import { MapPin } from "lucide-react";
import { Badge, Card, CardLink } from "@/components/ui/primitives";
import { Portrait } from "@/components/ui/Media";
import { cn } from "@/lib/utils";
import type {
  Candidate,
  CouncilOfficial,
  Leader,
  Person,
  Representative,
} from "@/types/content";

/**
 * The person card.
 *
 * One component renders every kind of profile so that a leader, a chairman, a
 * legislator and a candidate stay visually consistent across the site. The
 * named wrappers below exist because each directory reads better when it says
 * what it is rendering.
 */

export type PersonCardLayout = "portrait" | "row" | "feature";

export interface PersonCardProps {
  person: Person;
  href: string;
  layout?: PersonCardLayout;
  /** Small label above the name, e.g. the council or district. */
  context?: string;
  badge?: string;
  priority?: boolean;
  className?: string;
}

function displayName(person: Person) {
  return [person.honorific, person.name].filter(Boolean).join(" ");
}

function fullName(person: Person) {
  const base = displayName(person);
  return person.postNominals ? `${base}, ${person.postNominals}` : base;
}

export function PersonCard({
  person,
  href,
  layout = "portrait",
  context,
  badge,
  priority,
  className,
}: PersonCardProps) {
  if (layout === "row") {
    return (
      <Card
        as="article"
        interactive
        className={cn("group flex-row items-center gap-4 p-3 sm:gap-5 sm:p-4", className)}
      >
        <div className="w-20 shrink-0 overflow-hidden rounded-xl sm:w-24">
          <Portrait
            image={person.portrait}
            name={person.name}
            aspect="portrait"
            sizes="(min-width: 640px) 6rem, 5rem"
            pendingLabel=""
          />
        </div>
        <div className="min-w-0 flex-1">
          {context ? (
            <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
              {context}
            </p>
          ) : null}
          <h3 className="mt-0.5 font-display text-lg leading-tight text-fg">
            <CardLink href={href} ariaLabel={`View profile of ${fullName(person)}`}>
              {displayName(person)}
            </CardLink>
          </h3>
          <p className="mt-1 truncate text-sm text-fg-muted">{person.position}</p>
        </div>
      </Card>
    );
  }

  const isFeature = layout === "feature";

  return (
    <Card
      as="article"
      interactive
      className={cn("group h-full", className)}
    >
      <div className="relative">
        <Portrait
          image={person.portrait}
          name={person.name}
          aspect={isFeature ? "square" : "portrait"}
          priority={priority}
        />
        {badge ? (
          <div className="absolute left-3 top-3 z-20">
            <Badge tone="inverse">{badge}</Badge>
          </div>
        ) : null}
        {/* Legibility scrim only where text may sit over the image. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/45 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {context ? (
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
            {context}
          </p>
        ) : null}
        <h3
          className={cn(
            "mt-1.5 font-display leading-tight text-fg",
            isFeature ? "text-2xl" : "text-xl",
          )}
        >
          <CardLink href={href} ariaLabel={`View profile of ${fullName(person)}`}>
            {displayName(person)}
          </CardLink>
        </h3>
        {person.postNominals ? (
          <p className="mt-0.5 text-xs font-medium tracking-wide text-fg-subtle">
            {person.postNominals}
          </p>
        ) : null}

        <p className="mt-2 text-sm font-medium text-crimson-700">
          {person.shortPosition ?? person.position}
        </p>

        {person.summary ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-muted">
            {person.summary}
          </p>
        ) : null}

        {person.jurisdiction ? (
          <p className="mt-auto flex items-center gap-1.5 pt-4 text-[0.8125rem] text-fg-subtle">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{person.jurisdiction}</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Named wrappers                                                             */
/* -------------------------------------------------------------------------- */

export function LeaderCard({
  leader,
  layout,
  priority,
  className,
}: {
  leader: Leader;
  layout?: PersonCardLayout;
  priority?: boolean;
  className?: string;
}) {
  return (
    <PersonCard
      person={leader}
      href={`/leadership/${leader.slug}`}
      layout={layout}
      priority={priority}
      className={className}
      context={leader.jurisdiction ? undefined : "APC Lagos"}
    />
  );
}

export function ChairmanCard({
  official,
  councilName,
  layout,
  className,
}: {
  official: CouncilOfficial;
  councilName: string;
  layout?: PersonCardLayout;
  className?: string;
}) {
  return (
    <PersonCard
      person={official}
      href={`/${official.councilType === "LGA" ? "lgas" : "lcdas"}/${official.councilSlug}`}
      layout={layout}
      context={councilName}
      badge={official.councilType}
      className={className}
    />
  );
}

export function RepresentativeCard({
  representative,
  layout,
  className,
}: {
  representative: Representative;
  layout?: PersonCardLayout;
  className?: string;
}) {
  const chamber =
    representative.kind === "senator"
      ? "senate"
      : representative.kind === "house-of-representatives"
        ? "house-of-representatives"
        : "house-of-assembly";

  const chamberLabel =
    representative.kind === "senator"
      ? "Senate"
      : representative.kind === "house-of-representatives"
        ? "House of Representatives"
        : "House of Assembly";

  return (
    <PersonCard
      person={representative}
      href={`/representatives/${chamber}/${representative.slug}`}
      layout={layout}
      context={chamberLabel}
      className={className}
    />
  );
}

export function CandidateCard({
  candidate,
  layout,
  priority,
  className,
}: {
  candidate: Candidate;
  layout?: PersonCardLayout;
  priority?: boolean;
  className?: string;
}) {
  return (
    <PersonCard
      person={candidate}
      href={`/candidates/${candidate.slug}`}
      layout={layout}
      priority={priority}
      context={candidate.contestedSeat}
      badge={candidate.electionSlug}
      className={className}
    />
  );
}
