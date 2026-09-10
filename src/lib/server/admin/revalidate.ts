import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Pushing a change out to the public site.
 *
 * Most public routes are prerendered — that is what makes the site fast — so a
 * database write alone changes nothing a visitor sees. `revalidatePath` marks
 * the affected routes stale so the next request regenerates them.
 *
 * The paths are listed per collection rather than clearing everything, because
 * `revalidatePath("/", "layout")` invalidates the entire site including
 * thirty-odd prerendered constituency pages that a news article cannot
 * possibly have changed. Being specific keeps the cache useful.
 *
 * Detail routes are revalidated with an explicit slug where one is known. A
 * dynamic segment like `/news/[slug]` can be revalidated wholesale by passing
 * "page" as the type, which is what covers a record whose slug just changed.
 */

type Collection =
  | "people"
  | "articles"
  | "events"
  | "pages"
  | "categories"
  | "achievements"
  | "gallery"
  | "settings";

/** Routes that list or summarise each collection. */
const LIST_ROUTES: Record<Collection, string[]> = {
  people: [
    "/",
    "/leadership",
    "/representatives",
    "/representatives/senate",
    "/representatives/house-of-representatives",
    "/representatives/house-of-assembly",
    "/candidates",
    "/councils",
    "/structure",
    "/about",
    "/search",
  ],
  articles: ["/", "/news", "/search"],
  events: ["/", "/events", "/search"],
  pages: ["/", "/about", "/achievements", "/documents"],
  categories: ["/news"],
  achievements: ["/", "/achievements"],
  gallery: ["/", "/gallery", "/search"],
  settings: ["/", "/contact"],
};

/** Dynamic detail routes, revalidated as a whole segment. */
const DETAIL_ROUTES: Record<Collection, string[]> = {
  people: [
    "/leadership/[slug]",
    "/representatives/[chamber]/[slug]",
    "/candidates/[slug]",
    "/lgas/[slug]",
    "/lcdas/[slug]",
  ],
  articles: ["/news/[slug]"],
  events: ["/events/[slug]"],
  pages: [],
  categories: ["/news/[slug]"],
  achievements: ["/lgas/[slug]"],
  gallery: ["/gallery/[slug]", "/events/[slug]"],
  settings: [],
};

/**
 * Marks everything a change to `collection` could affect as stale.
 *
 * Failure is swallowed on purpose. The write has already succeeded by the time
 * this runs, and a cache that refreshes a few minutes later is a far better
 * outcome than an editor being told their saved record failed to save.
 */
export function revalidateFor(collection: Collection): void {
  try {
    for (const path of LIST_ROUTES[collection]) {
      revalidatePath(path);
    }
    for (const path of DETAIL_ROUTES[collection]) {
      revalidatePath(path, "page");
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[admin] revalidation after ${collection} write failed: ${name}`);
  }
}
