import { siteConfig } from "@/data/site";
import type { ArticleBlock, ISODateString } from "@/types/content";

/**
 * All dates render in Africa/Lagos so the server and the browser agree, which
 * keeps published timestamps stable and avoids hydration mismatches.
 */
const LOCALE = "en-NG";

function toDate(value: ISODateString): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(
  value: ISODateString | undefined,
  style: "long" | "medium" | "short" = "long",
): string {
  if (!value) return "";
  const d = toDate(value);
  if (!d) return "";
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : style === "medium"
        ? { day: "numeric", month: "short", year: "numeric" }
        : { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    timeZone: siteConfig.timeZone,
  }).format(d);
}

export function formatTime(value: ISODateString | undefined): string {
  if (!value) return "";
  const d = toDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: siteConfig.timeZone,
  }).format(d);
}

export function formatDateTime(value: ISODateString | undefined): string {
  if (!value) return "";
  const date = formatDate(value);
  const time = formatTime(value);
  return time ? `${date} · ${time}` : date;
}

/** Splits an ISO date into the parts a calendar chip needs. */
export function dateParts(value: ISODateString) {
  const d = toDate(value);
  if (!d) return { day: "", month: "", year: "" };
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE, {
      ...options,
      timeZone: siteConfig.timeZone,
    }).format(d);
  return {
    day: fmt({ day: "numeric" }),
    month: fmt({ month: "short" }).toUpperCase(),
    year: fmt({ year: "numeric" }),
  };
}

export function isPast(value: ISODateString | undefined, now = Date.now()) {
  if (!value) return false;
  const d = toDate(value);
  return d ? d.getTime() < now : false;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

/** Words per minute used for the reading-time estimate on articles. */
const WPM = 220;

export function readingMinutes(body: ArticleBlock[]): number {
  const words = body.reduce((total, block) => {
    switch (block.type) {
      case "paragraph":
      case "heading":
        return total + block.text.split(/\s+/).length;
      case "quote":
        return total + block.text.split(/\s+/).length;
      case "list":
        return total + block.items.join(" ").split(/\s+/).length;
      default:
        return total;
    }
  }, 0);
  return Math.max(1, Math.round(words / WPM));
}

/** Turns "house-of-representatives" into "House of Representatives". */
const SMALL_WORDS = new Set(["of", "and", "the", "to", "for", "in", "on", "a"]);

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Truncate on a word boundary, appending an ellipsis when shortened. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}
