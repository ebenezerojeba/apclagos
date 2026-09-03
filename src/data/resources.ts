import type { Achievement, PartyDocument, Ward } from "@/types/content";

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
 * WARDS — ships empty on purpose.
 *
 * Lagos State is delimited into INEC wards across its 20 LGAs. The per-LGA
 * breakdown has deliberately NOT been estimated. Load the party's authoritative
 * ward register here (a CSV template is provided at `content/wards.template.csv`)
 * and the ward directory, council pages and structure explorer fill in.
 *
 * WORKED EXAMPLE:
 *
 *   { id: "ikeja-01", slug: "ikeja-01", status: "published",
 *     name: "Ward A", code: "01", lgaSlug: "ikeja", lcdaSlug: "onigbongbo" }
 */
export const wards: Ward[] = [];
