import { cn } from "@/lib/utils";

/**
 * Loading skeletons.
 *
 * These are not generic grey boxes: each one mirrors the block structure of the
 * page it stands in for, so the layout does not jump when the real content
 * arrives and the viewer can already see what kind of page is coming.
 *
 * House rules:
 *  - only the outermost skeleton of a route carries the live-region attributes,
 *    so a screen reader hears "Loading" once rather than once per card;
 *  - every skeleton uses the same `.skeleton` shimmer from `globals.css`, which
 *    is already reduced-motion aware;
 *  - dimensions come from the real components, so a skeleton and its content
 *    occupy the same space.
 */

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                 */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

/** A block of text lines, with a shorter last line as real paragraphs have. */
export function ContentSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Reserves an image box at a given ratio so nothing reflows on load. */
export function ImageSkeleton({
  aspect = "aspect-16/9",
  className,
}: {
  aspect?: string;
  className?: string;
}) {
  return <Skeleton className={cn("rounded-none", aspect, className)} />;
}

/** Wraps a route skeleton and announces it once. */
export function LoadingRegion({
  children,
  label = "Loading",
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page furniture                                                             */
/* -------------------------------------------------------------------------- */

/** Mirrors `PageHeader`: dark panel, breadcrumbs, title, description, facts. */
export function PageHeaderSkeleton({ facts = 4 }: { facts?: number }) {
  return (
    <header className="panel-ink relative isolate overflow-hidden">
      <div className="container-page py-10 sm:py-14 lg:py-16">
        <div className="flex gap-2">
          <Skeleton className="h-3 w-12 bg-white/10" />
          <Skeleton className="h-3 w-20 bg-white/10" />
          <Skeleton className="h-3 w-16 bg-white/10" />
        </div>
        <Skeleton className="mt-7 h-3 w-32 bg-white/10" />
        <Skeleton className="mt-4 h-11 w-full max-w-lg bg-white/12 sm:h-14" />
        <div className="mt-5 max-w-2xl space-y-2.5">
          <Skeleton className="h-4 w-full bg-white/8" />
          <Skeleton className="h-4 w-4/5 bg-white/8" />
        </div>
        {facts > 0 ? (
          <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: facts }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-2.5 w-24 bg-white/10" />
                <Skeleton className="mt-2 h-6 w-16 bg-white/12" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

/** Mirrors the homepage hero: full-bleed panel, headline, CTAs, stats, controls. */
export function HeroSkeleton() {
  return (
    <section className="panel-ink relative isolate flex min-h-[32rem] flex-col overflow-hidden sm:min-h-[38rem] lg:min-h-[min(88svh,50rem)]">
      <div className="container-page relative flex flex-1 flex-col pb-7 pt-16 sm:pb-8 sm:pt-24 lg:pb-10 lg:pt-32">
        <div className="flex-1">
          <Skeleton className="h-3 w-56 bg-white/10" />
          <Skeleton className="mt-6 h-12 w-full max-w-2xl bg-white/12 sm:h-16" />
          <Skeleton className="mt-3 h-12 w-3/4 max-w-xl bg-white/12 sm:h-16" />
          <div className="mt-7 max-w-2xl space-y-2.5">
            <Skeleton className="h-4 w-full bg-white/8" />
            <Skeleton className="h-4 w-5/6 bg-white/8" />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
            <Skeleton className="h-13 w-full rounded-full bg-white/20 sm:w-52" />
            <Skeleton className="h-13 w-full rounded-full bg-white/10 sm:w-44" />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/12 pt-6 sm:mt-14 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-28 bg-white/10" />
              <Skeleton className="mt-2 h-8 w-20 bg-white/12" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/12 pt-5 sm:mt-12">
          <div className="flex flex-1 gap-3 lg:max-w-xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1">
                <Skeleton className="h-2.5 w-16 bg-white/10" />
                <Skeleton className="mt-2 h-0.5 w-full bg-white/15" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-11 rounded-full bg-white/10" />
            <Skeleton className="size-11 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Mirrors the filter panel that sits above every directory. */
export function FilterBarSkeleton({ selects = 1 }: { selects?: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 lg:items-end">
        <div className="lg:col-span-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="mt-1.5 h-11 w-full rounded-full" />
        </div>
        {Array.from({ length: selects }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-1.5 h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-border-subtle pt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="mt-3 h-9 w-full max-w-md" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cards                                                                      */
/* -------------------------------------------------------------------------- */

/** Portrait card — people directories and council chairmen. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <ImageSkeleton aspect="aspect-3/4" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** Mirrors `NewsCard`: 16:9 cover, category chip, headline, excerpt, byline. */
export function NewsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <ImageSkeleton aspect="aspect-16/9" />
      <div className="p-5">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="mt-3 h-6 w-full" />
        <Skeleton className="mt-2 h-6 w-4/5" />
        <ContentSkeleton lines={2} className="mt-3" />
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors `EventCard`: 3:2 cover with the date chip, title, summary, meta. */
export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <ImageSkeleton aspect="aspect-3/2" />
      <div className="absolute left-4 top-4 rounded-xl bg-surface p-2.5 shadow-[var(--shadow-card)]">
        <Skeleton className="h-6 w-8" />
        <Skeleton className="mt-1 h-2.5 w-8" />
      </div>
      <div className="p-5">
        <Skeleton className="h-6 w-4/5" />
        <ContentSkeleton lines={2} className="mt-3" />
        <div className="mt-5 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

/** Mirrors `CouncilCard`: header band, chairman row, two-up figures. */
export function CouncilCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <div className="border-b border-border-subtle px-5 pb-4 pt-5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="mt-2.5 h-6 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border-subtle pt-3.5">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Landscape media card — gallery albums and videos. */
export function MediaCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <ImageSkeleton aspect="aspect-3/2" />
      <div className="p-5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="mt-2 h-5 w-3/4" />
        <ContentSkeleton lines={2} className="mt-3" />
        <Skeleton className="mt-5 h-3 w-28" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Grids                                                                      */
/* -------------------------------------------------------------------------- */

type CardKind = "portrait" | "news" | "event" | "council" | "media";

const CARD_BY_KIND: Record<CardKind, (props: { className?: string }) => React.ReactElement> = {
  portrait: CardSkeleton,
  news: NewsCardSkeleton,
  event: EventCardSkeleton,
  council: CouncilCardSkeleton,
  media: MediaCardSkeleton,
};

export function GridSkeleton({
  count = 8,
  kind = "portrait",
  columns = "quad",
  className,
}: {
  count?: number;
  kind?: CardKind;
  columns?: "duo" | "trio" | "quad";
  className?: string;
}) {
  const Card = CARD_BY_KIND[kind];
  const cols = {
    duo: "sm:grid-cols-2",
    trio: "sm:grid-cols-2 lg:grid-cols-3",
    quad: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-5", cols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Whole-route compositions                                                   */
/* -------------------------------------------------------------------------- */

/** The default route skeleton: header plus a card grid. */
export function PageSkeleton({
  facts = 4,
  kind = "portrait",
  count = 8,
  columns = "quad",
}: {
  facts?: number;
  kind?: CardKind;
  count?: number;
  columns?: "duo" | "trio" | "quad";
}) {
  return (
    <LoadingRegion label="Loading page">
      <PageHeaderSkeleton facts={facts} />
      <div className="container-page py-16">
        <GridSkeleton count={count} kind={kind} columns={columns} />
      </div>
    </LoadingRegion>
  );
}

/** Header, filter panel, result count, then a grid — every directory route. */
export function DirectorySkeleton({
  kind = "portrait",
  count = 8,
  selects = 1,
  facts = 4,
}: {
  kind?: CardKind;
  count?: number;
  selects?: number;
  facts?: number;
}) {
  return (
    <LoadingRegion label="Loading directory">
      <PageHeaderSkeleton facts={facts} />
      <div className="container-page py-16">
        <FilterBarSkeleton selects={selects} />
        <div className="mt-7 flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <GridSkeleton className="mt-8" count={count} kind={kind} />
      </div>
    </LoadingRegion>
  );
}

/** Long-form article: lead image, prose column, share rail, related cards. */
export function ArticleSkeleton() {
  return (
    <LoadingRegion label="Loading article">
      <PageHeaderSkeleton facts={0} />
      <div className="container-page -mt-6 sm:-mt-8">
        <ImageSkeleton aspect="aspect-3/2" className="rounded-2xl" />
      </div>
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:gap-16">
          <div className="max-w-3xl space-y-8">
            <ContentSkeleton lines={4} />
            <ContentSkeleton lines={5} />
            <Skeleton className="h-7 w-1/2" />
            <ContentSkeleton lines={4} />
            <ContentSkeleton lines={3} />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-2.5 w-28" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="size-10 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

/** Profile route: sticky portrait column beside biography and key information. */
export function ProfileSkeleton() {
  return (
    <LoadingRegion label="Loading profile">
      <PageHeaderSkeleton facts={0} />
      <div className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
              <ImageSkeleton aspect="aspect-3/4" />
              <div className="space-y-2.5 p-5">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-border-subtle bg-surface p-5">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-4 py-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <Skeleton className="h-7 w-4/5" />
            <ContentSkeleton lines={5} />
            <ContentSkeleton lines={4} />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

/** The newsroom: filters, a two-up article grid and the sidebar rails. */
export function NewsroomSkeleton() {
  return (
    <LoadingRegion label="Loading newsroom">
      <PageHeaderSkeleton />
      <div className="container-page py-16">
        <FilterBarSkeleton selects={0} />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-14">
          <GridSkeleton count={6} kind="news" columns="duo" />
          <div className="space-y-6">
            <Skeleton className="h-7 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-border-subtle bg-surface p-3">
                <Skeleton className="h-20 w-28 shrink-0 rounded-lg sm:w-36" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
