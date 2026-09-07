import type { Achievement, PartyDocument } from "@/types/content";

/**
 * ACHIEVEMENTS — ships empty on purpose.
 *
 * Every entry carries a `source` field so each claim stays attributable to the
 * ministry, agency or council that published it. Records without a source are
 * flagged in the admin review queue.
 *
 * WORKED EXAMPLE:
 *
 *   {
 *     id: "a-0001",
 *     slug: "example-project",
 *     status: "published",
 *     title: "Project or milestone title",
 *     summary: "One sentence shown on the card.",
 *     description: ["Longer paragraph."],
 *     category: "infrastructure",
 *     year: 2025,
 *     location: "Ikorodu, Lagos",
 *     lgaSlug: "ikorodu",
 *     metrics: [{ label: "Kilometres delivered", value: "12.4" }],
 *     source: "Lagos State Ministry of Works and Infrastructure",
 *     cover: { src: "/images/achievements/…jpg", alt: "…", width: 1600, height: 900 },
 *   }
 */
export const achievements: Achievement[] = [];

/**
 * DOCUMENTS — ships empty on purpose.
 *
 * Place files in `public/documents/` and register them here so the library can
 * show file type and size before a visitor commits to a download.
 *
 * WORKED EXAMPLE:
 *
 *   {
 *     id: "d-0001",
 *     slug: "party-constitution",
 *     status: "published",
 *     title: "Document title",
 *     description: "What the document contains.",
 *     category: "constitution",
 *     fileUrl: "/documents/party-constitution.pdf",
 *     fileType: "pdf",
 *     fileSizeLabel: "1.8 MB",
 *     publishedAt: "2022-03-26",
 *   }
 */
export const partyDocuments: PartyDocument[] = [];

/**
 * WARDS - the LASIEC register, loaded from `src/data/wards.ts`.
 *
 * Lagos State is delimited into 376 wards across 57 administrative councils:
 * the 20 local government areas and the 37 LCDAs carved out of them. The
 * register is stored verbatim at `src/data/lagos-wards.json` and mapped onto
 * this application's council model in `src/data/wards.ts`.
 *
 * It stays in the repository rather than the database for the same reason the
 * constituencies do: ward delimitation changes by legislation, not by an
 * editor, and a mistyped ward slug would silently detach a ward from its
 * council. `scripts/verify-wards.mjs` re-checks the mapping against the
 * register's own totals.
 *
 * No per-ward code is published in the register, so `Ward.code` is unset rather
 * than invented.
 */
export { wards } from "./wards";
