/**
 * URL-safe slug generation shared by the data layer and the (future) admin CMS.
 * Kept dependency-free so it can run in the browser, on the server and in the
 * Node scripts that import content.
 */

/** Combining diacritical marks, stripped after NFKD normalisation. */
const COMBINING_MARKS = /[̀-ͯ]/g;
/** Straight and curly apostrophes, removed rather than turned into hyphens. */
const APOSTROPHES = /[‘’']/g;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Two-letter monogram used by the avatar fallback when no portrait exists. */
export function initialsOf(name: string): string {
  const parts = name
    .replace(/[^\p{L}\s'-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
