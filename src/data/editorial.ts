import type {
  NewsArticle,
  NewsCategory,
  NewsCategorySlug,
  PartyEvent,
} from "@/types/content";

/**
 * Newsroom taxonomy. Categories are structural, so they are defined up front and
 * used by the filter chips, the category pages and the SEO breadcrumbs.
 */
export const newsCategories: NewsCategory[] = [
  {
    slug: "apc-lagos",
    name: "APC Lagos",
    description: "Party-wide announcements from the Lagos State chapter.",
  },
  {
    slug: "leadership",
    name: "Leadership",
    description: "Statements and activities of the party leadership.",
  },
  {
    slug: "elections",
    name: "Elections",
    description: "Nominations, primaries, campaigns and electoral guidance.",
  },
  {
    slug: "government",
    name: "Government",
    description: "Policy and delivery updates from government.",
  },
  {
    slug: "lgas",
    name: "LGAs",
    description: "News from the 20 Local Government Areas.",
  },
  {
    slug: "lcdas",
    name: "LCDAs",
    description: "News from the 37 Local Council Development Areas.",
  },
  {
    slug: "house-of-assembly",
    name: "House of Assembly",
    description: "From the Lagos State House of Assembly.",
  },
  {
    slug: "house-of-representatives",
    name: "House of Representatives",
    description: "From the Lagos delegation in the House of Representatives.",
  },
  {
    slug: "senate",
    name: "Senate",
    description: "From the senators representing Lagos State.",
  },
  {
    slug: "events",
    name: "Events",
    description: "Congresses, rallies, town halls and party gatherings.",
  },
  {
    slug: "press-releases",
    name: "Press Releases",
    description: "Official statements issued by the state secretariat.",
  },
];

export const newsCategoryMap = new Map<NewsCategorySlug, NewsCategory>(
  newsCategories.map((c) => [c.slug, c]),
);

/**
 * NEWS — ships empty on purpose. No headline, quote or announcement has been
 * invented. Publish real articles here (or connect the API in
 * `src/lib/content.ts`) and the newsroom, homepage rails, search index and
 * sitemap update automatically.
 *
 * WORKED EXAMPLE (copy, then replace every value):
 *
 *   {
 *     id: "n-0001",
 *     slug: "state-secretariat-briefing",
 *     status: "published",
 *     title: "Headline goes here",
 *     kicker: "Optional short deck",
 *     excerpt: "One or two sentences used on cards and in meta descriptions.",
 *     category: "press-releases",
 *     tags: ["secretariat"],
 *     author: { name: "APC Lagos Media Office", role: "Communications" },
 *     publishedAt: "2026-02-14T09:00:00+01:00",
 *     cover: {
 *       src: "/images/news/state-secretariat-briefing.jpg",
 *       alt: "Describe the photograph",
 *       width: 1600, height: 900, role: "news",
 *     },
 *     featured: true,
 *     body: [
 *       { type: "paragraph", text: "Opening paragraph." },
 *       { type: "heading", level: 2, text: "A section heading" },
 *       { type: "list", items: ["Point one", "Point two"] },
 *       { type: "quote", text: "A quotation.", attribution: "Name, Office" },
 *     ],
 *   }
 */
export const newsArticles: NewsArticle[] = [];

/**
 * EVENTS — ships empty on purpose.
 *
 * WORKED EXAMPLE:
 *
 *   {
 *     id: "e-0001",
 *     slug: "lagos-west-stakeholders-meeting",
 *     status: "published",
 *     title: "Event title",
 *     summary: "One sentence shown on the event card.",
 *     category: "meeting",
 *     startsAt: "2026-03-04T10:00:00+01:00",
 *     endsAt: "2026-03-04T14:00:00+01:00",
 *     venueName: "Venue name",
 *     venueAddress: "Street, area, Lagos",
 *     lgaSlug: "ikeja",
 *     registrationUrl: "https://…",
 *     cover: { src: "/images/events/…jpg", alt: "…", width: 1600, height: 900 },
 *   }
 */
export const partyEvents: PartyEvent[] = [];
