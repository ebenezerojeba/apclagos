import {
  CalendarDays,
  Clock,
  Download,
  FileText,
  Images,
  MapPin,
  Play,
} from "lucide-react";
import { Badge, Card, CardLink } from "@/components/ui/primitives";
import { SmartImage, SIZES } from "@/components/ui/Media";
import { dateParts, formatDate, formatTime, readingMinutes } from "@/lib/format";
import { newsCategoryMap } from "@/data/editorial";
import { cn } from "@/lib/utils";
import { youtubeThumbnail } from "@/lib/video";
import type {
  Achievement,
  GalleryAlbum,
  NewsArticle,
  PartyDocument,
  PartyEvent,
  StatItem,
  Video,
} from "@/types/content";

/* -------------------------------------------------------------------------- */
/*  News                                                                       */
/* -------------------------------------------------------------------------- */

export function NewsCard({
  article,
  layout = "stacked",
  priority,
  className,
}: {
  article: NewsArticle;
  layout?: "stacked" | "feature" | "row";
  priority?: boolean;
  className?: string;
}) {
  const category = newsCategoryMap.get(article.category);
  const minutes = readingMinutes(article.body);
  const href = `/news/${article.slug}`;

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-fg-subtle">
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, "medium")}</time>
      <span aria-hidden="true" className="size-1 rounded-full bg-paper-400" />
      <span>{minutes} min read</span>
      {article.author ? (
        <>
          <span aria-hidden="true" className="size-1 rounded-full bg-paper-400" />
          <span className="truncate">{article.author.name}</span>
        </>
      ) : null}
    </div>
  );

  if (layout === "row") {
    return (
      <Card as="article" interactive className={cn("group flex-row gap-4 p-3", className)}>
        <div className="w-28 shrink-0 overflow-hidden rounded-lg sm:w-36">
          <SmartImage
            image={article.cover}
            aspect="news"
            sizes="(min-width: 640px) 9rem, 7rem"
            zoomOnHover
          />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          {category ? (
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-crimson-700">
              {category.name}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-display text-base leading-snug text-fg">
            <CardLink href={href}>{article.title}</CardLink>
          </h3>
          <div className="mt-1.5">{meta}</div>
        </div>
      </Card>
    );
  }

  const isFeature = layout === "feature";

  return (
    <Card
      as="article"
      interactive
      className={cn("group h-full", isFeature && "lg:flex-row", className)}
    >
      <div className={cn(isFeature && "lg:w-[58%] lg:shrink-0")}>
        <SmartImage
          image={article.cover}
          aspect={isFeature ? "event" : "news"}
          sizes={isFeature ? SIZES.feature : SIZES.card}
          priority={priority}
          zoomOnHover
        />
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col p-5",
          isFeature && "lg:justify-center lg:p-8 xl:p-10",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {category ? <Badge tone="crimson">{category.name}</Badge> : null}
          {article.featured && !isFeature ? <Badge tone="brass">Featured</Badge> : null}
        </div>
        <h3
          className={cn(
            "mt-3 font-display leading-tight text-fg",
            isFeature ? "text-display-md" : "text-xl",
          )}
        >
          <CardLink href={href}>{article.title}</CardLink>
        </h3>
        <p
          className={cn(
            "mt-2.5 text-sm leading-relaxed text-fg-muted",
            isFeature ? "line-clamp-4 md:text-base" : "line-clamp-3",
          )}
        >
          {article.excerpt}
        </p>
        <div className="mt-auto pt-4">{meta}</div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Events                                                                     */
/* -------------------------------------------------------------------------- */

export function EventCard({
  event,
  className,
  priority,
}: {
  event: PartyEvent;
  className?: string;
  priority?: boolean;
}) {
  const { day, month, year } = dateParts(event.startsAt);
  const href = `/events/${event.slug}`;

  return (
    <Card as="article" interactive className={cn("group h-full", className)}>
      <div className="relative">
        <SmartImage
          image={event.cover}
          aspect="event"
          sizes={SIZES.card}
          zoomOnHover
          priority={priority}
        />
        <div className="absolute left-4 top-4 z-20 flex flex-col items-center rounded-xl bg-surface px-3 py-2 shadow-[var(--shadow-card)]">
          <span className="tnum font-display text-xl leading-none text-fg">{day}</span>
          <span className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-crimson-700">
            {month}
          </span>
          <span className="tnum text-[0.625rem] text-fg-subtle">{year}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {event.notice ? (
          <p className="mb-2">
            <Badge tone="crimson">{event.notice}</Badge>
          </p>
        ) : null}
        <h3 className="font-display text-xl leading-tight text-fg">
          <CardLink href={href}>{event.title}</CardLink>
        </h3>
        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-fg-muted">
          {event.summary}
        </p>
        <dl className="mt-auto space-y-1.5 pt-4 text-[0.8125rem] text-fg-subtle">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Time</dt>
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <dd>
              <time dateTime={event.startsAt}>{formatTime(event.startsAt)}</time>
              {event.endsAt ? (
                <>
                  {" – "}
                  <time dateTime={event.endsAt}>{formatTime(event.endsAt)}</time>
                </>
              ) : null}
            </dd>
          </div>
          {event.venueName ? (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Venue</dt>
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <dd className="truncate">{event.venueName}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export function GalleryCard({
  album,
  className,
}: {
  album: GalleryAlbum;
  className?: string;
}) {
  return (
    <Card as="article" interactive className={cn("group h-full", className)}>
      <div className="relative">
        <SmartImage
          image={album.cover ?? album.images[0]}
          aspect="event"
          sizes={SIZES.card}
          zoomOnHover
        />
        <div className="absolute right-3 top-3 z-20">
          <Badge tone="inverse">
            <Images className="size-3" aria-hidden="true" />
            {album.images.length}
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {album.category.replace(/-/g, " ")}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-tight text-fg">
          <CardLink href={`/gallery/${album.slug}`}>{album.title}</CardLink>
        </h3>
        {album.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{album.description}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-4 text-[0.8125rem] text-fg-subtle">
          {album.date ? (
            <>
              <CalendarDays className="size-3.5" aria-hidden="true" />
              <time dateTime={album.date}>{formatDate(album.date, "medium")}</time>
            </>
          ) : null}
          {album.location ? (
            <>
              <span aria-hidden="true" className="size-1 rounded-full bg-paper-400" />
              <span className="truncate">{album.location}</span>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Video                                                                      */
/* -------------------------------------------------------------------------- */

export function VideoCard({
  video,
  className,
}: {
  video: Video;
  className?: string;
}) {
  const poster =
    video.embed.poster ??
    (video.embed.provider === "youtube"
      ? { src: youtubeThumbnail(video.embed.ref), alt: video.title }
      : undefined);

  return (
    <Card as="article" interactive className={cn("group h-full", className)}>
      <div className="relative">
        <SmartImage image={poster} aspect="news" sizes={SIZES.card} zoomOnHover />
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)] transition-transform duration-300 group-hover:scale-105">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
        {video.embed.duration ? (
          <span className="tnum absolute bottom-3 right-3 z-20 rounded-md bg-ink-950/80 px-2 py-0.5 text-xs font-medium text-white">
            {video.embed.duration}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
          {video.category}
        </p>
        <h3 className="mt-1.5 font-display text-lg leading-tight text-fg">
          <CardLink href={`/media/${video.slug}`}>{video.title}</CardLink>
        </h3>
        {video.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{video.description}</p>
        ) : null}
        {video.publishedAt ? (
          <time
            dateTime={video.publishedAt}
            className="mt-auto pt-4 text-[0.8125rem] text-fg-subtle"
          >
            {formatDate(video.publishedAt, "medium")}
          </time>
        ) : null}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Achievement                                                                */
/* -------------------------------------------------------------------------- */

export function AchievementCard({
  achievement,
  className,
}: {
  achievement: Achievement;
  className?: string;
}) {
  return (
    <Card as="article" className={cn("group h-full", className)}>
      <SmartImage
        image={achievement.cover}
        aspect="event"
        sizes={SIZES.card}
        zoomOnHover
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="verdant">{achievement.category.replace(/-/g, " ")}</Badge>
          {achievement.year ? (
            <span className="tnum text-[0.8125rem] text-fg-subtle">{achievement.year}</span>
          ) : null}
        </div>
        <h3 className="mt-3 font-display text-lg leading-tight text-fg">
          {achievement.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-fg-muted">
          {achievement.summary}
        </p>

        {achievement.metrics?.length ? (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
            {achievement.metrics.slice(0, 2).map((metric) => (
              <div key={metric.label}>
                <dt className="text-[0.6875rem] uppercase tracking-[0.1em] text-fg-subtle">
                  {metric.label}
                </dt>
                <dd className="tnum mt-0.5 font-display text-xl text-fg">{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-auto pt-4 text-[0.75rem] text-fg-subtle">
          {achievement.location ? <span>{achievement.location}</span> : null}
          {achievement.source ? (
            <span className="mt-0.5 block">Source: {achievement.source}</span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Document                                                                   */
/* -------------------------------------------------------------------------- */

export function DocumentCard({
  document,
  className,
}: {
  document: PartyDocument;
  className?: string;
}) {
  return (
    <Card
      as="article"
      interactive
      className={cn("group flex-row items-start gap-4 p-5", className)}
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-700"
      >
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base leading-snug text-fg">
          <a
            href={document.fileUrl}
            className="after:absolute after:inset-0 after:content-['']"
            download
          >
            {document.title}
          </a>
        </h3>
        {document.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">
            {document.description}
          </p>
        ) : null}
        <p className="tnum mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] uppercase tracking-wider text-fg-subtle">
          <span>{document.fileType}</span>
          {document.fileSizeLabel ? (
            <>
              <span aria-hidden="true" className="size-1 rounded-full bg-paper-400" />
              <span>{document.fileSizeLabel}</span>
            </>
          ) : null}
          {document.publishedAt ? (
            <>
              <span aria-hidden="true" className="size-1 rounded-full bg-paper-400" />
              <time dateTime={document.publishedAt}>
                {formatDate(document.publishedAt, "medium")}
              </time>
            </>
          ) : null}
        </p>
      </div>
      <Download
        aria-hidden="true"
        className="size-4 shrink-0 text-paper-500 transition-colors group-hover:text-ink-700"
      />
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Statistic                                                                  */
/* -------------------------------------------------------------------------- */

export function StatCard({
  stat,
  children,
  tone = "light",
  className,
}: {
  stat: StatItem;
  /** The animated counter is injected so this stays a server component. */
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  const body = (
    <>
      <div
        className={cn(
          "font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-none tracking-tight",
          dark ? "text-white" : "text-fg",
        )}
      >
        {children}
      </div>
      <p
        className={cn(
          "mt-3 text-sm font-semibold",
          dark ? "text-brass-300" : "text-crimson-700",
        )}
      >
        {stat.label}
      </p>
      {stat.description ? (
        <p className={cn("mt-1.5 text-[0.8125rem] leading-relaxed", dark ? "text-ink-300" : "text-fg-muted")}>
          {stat.description}
        </p>
      ) : null}
      {stat.note ? (
        <p className={cn("mt-2 text-[0.6875rem] leading-relaxed", dark ? "text-ink-400" : "text-fg-subtle")}>
          {stat.note}
        </p>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "relative flex flex-col p-6 lg:p-7",
        dark ? "" : "bg-surface",
        className,
      )}
    >
      {stat.href ? <CardLink href={stat.href} ariaLabel={stat.label} /> : null}
      {body}
    </div>
  );
}
