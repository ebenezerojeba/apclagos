import "server-only";

import {
  getCandidates,
  getDocuments,
  getEvents,
  getFederalConstituencies,
  getGalleryAlbums,
  getLcdas,
  getLeaders,
  getLgas,
  getNews,
  getRepresentatives,
  getSenatorialDistricts,
  getStateConstituencies,
  getVideos,
  getWards,
} from "@/lib/content";
import { escapeRegExp } from "@/lib/utils";
import { titleFromSlug } from "@/lib/format";
import type { SearchDocument } from "@/types/content";

/**
 * Global search.
 *
 * The index is assembled from the content repository on the server, so it stays
 * in step with whatever the data layer is reading from. Static pages are indexed
 * alongside records so a visitor searching "structure" or "contact" lands
 * somewhere useful.
 */

const STATIC_PAGES: Omit<SearchDocument, "keywords">[] = [
  {
    id: "page-about",
    type: "page",
    title: "About APC Lagos",
    subtitle: "History, mission and organisation",
    href: "/about",
    weight: 90,
  },
  {
    id: "page-structure",
    type: "page",
    title: "Political Structure",
    subtitle: "State, LGA, LCDA and ward hierarchy",
    href: "/structure",
    weight: 90,
  },
  {
    id: "page-leadership",
    type: "page",
    title: "Leadership",
    subtitle: "State executive and party organs",
    href: "/leadership",
    weight: 92,
  },
  {
    id: "page-councils",
    type: "page",
    title: "Local Councils",
    subtitle: "All 57 LGAs and LCDAs",
    href: "/councils",
    weight: 92,
  },
  {
    id: "page-representatives",
    type: "page",
    title: "Representatives",
    subtitle: "Senate, House of Representatives, House of Assembly",
    href: "/representatives",
    weight: 92,
  },
  {
    id: "page-candidates",
    type: "page",
    title: "Candidates",
    subtitle: "Candidate directory",
    href: "/candidates",
    weight: 90,
  },
  {
    id: "page-election-2027",
    type: "page",
    title: "Election 2027",
    subtitle: "The next general election cycle",
    href: "/elections/2027",
    weight: 94,
  },
  {
    id: "page-news",
    type: "page",
    title: "News",
    subtitle: "Announcements and press releases",
    href: "/news",
    weight: 88,
  },
  {
    id: "page-events",
    type: "page",
    title: "Events",
    subtitle: "Congresses, rallies and meetings",
    href: "/events",
    weight: 88,
  },
  {
    id: "page-gallery",
    type: "page",
    title: "Photo Gallery",
    subtitle: "Albums by event and campaign",
    href: "/gallery",
    weight: 84,
  },
  {
    id: "page-media",
    type: "page",
    title: "Videos",
    subtitle: "Speeches, interviews and activities",
    href: "/media",
    weight: 84,
  },
  {
    id: "page-achievements",
    type: "page",
    title: "Achievements",
    subtitle: "Delivery record by sector",
    href: "/achievements",
    weight: 84,
  },
  {
    id: "page-documents",
    type: "page",
    title: "Documents",
    subtitle: "Constitution, policies and forms",
    href: "/documents",
    weight: 82,
  },
  {
    id: "page-contact",
    type: "page",
    title: "Contact",
    subtitle: "Secretariat and enquiries",
    href: "/contact",
    weight: 86,
  },
];

function haystack(...parts: (string | undefined | string[])[]): string {
  return parts
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

let cached: SearchDocument[] | null = null;

export async function getSearchIndex(): Promise<SearchDocument[]> {
  if (cached) return cached;

  const [
    leaders,
    representatives,
    candidates,
    lgas,
    lcdas,
    wards,
    districts,
    federal,
    state,
    news,
    events,
    albums,
    videos,
    documents,
  ] = await Promise.all([
    getLeaders(),
    getRepresentatives(),
    getCandidates(),
    getLgas(),
    getLcdas(),
    getWards(),
    getSenatorialDistricts(),
    getFederalConstituencies(),
    getStateConstituencies(),
    getNews(),
    getEvents(),
    getGalleryAlbums(),
    getVideos(),
    getDocuments(),
  ]);

  const docs: SearchDocument[] = [];

  for (const page of STATIC_PAGES) {
    docs.push({ ...page, keywords: haystack(page.title, page.subtitle) });
  }

  for (const p of leaders) {
    docs.push({
      id: `leader-${p.slug}`,
      type: "person",
      title: [p.honorific, p.name].filter(Boolean).join(" "),
      subtitle: p.position,
      description: p.summary,
      href: `/leadership/${p.slug}`,
      image: p.portrait,
      weight: 80,
      keywords: haystack(p.name, p.position, p.jurisdiction, p.summary, p.tags),
    });
  }

  for (const p of representatives) {
    const chamber =
      p.kind === "senator"
        ? "senate"
        : p.kind === "house-of-representatives"
          ? "house-of-representatives"
          : "house-of-assembly";
    docs.push({
      id: `rep-${p.slug}`,
      type: "person",
      title: [p.honorific, p.name].filter(Boolean).join(" "),
      subtitle: `${p.position}${p.jurisdiction ? ` · ${p.jurisdiction}` : ""}`,
      description: p.summary,
      href: `/representatives/${chamber}/${p.slug}`,
      image: p.portrait,
      weight: 78,
      keywords: haystack(p.name, p.position, p.jurisdiction, p.summary, p.tags),
    });
  }

  for (const c of candidates) {
    docs.push({
      id: `candidate-${c.slug}`,
      type: "candidate",
      title: [c.honorific, c.name].filter(Boolean).join(" "),
      subtitle: `${c.position}${c.contestedSeat ? ` · ${c.contestedSeat}` : ""}`,
      description: c.summary,
      href: `/candidates/${c.slug}`,
      image: c.portrait,
      weight: 80,
      keywords: haystack(c.name, c.position, c.contestedSeat, c.summary, c.tags),
    });
  }

  for (const l of lgas) {
    docs.push({
      id: `lga-${l.slug}`,
      type: "lga",
      title: l.name,
      subtitle: "Local Government Area",
      href: `/lgas/${l.slug}`,
      weight: 74,
      keywords: haystack(l.name, "lga local government area", l.headquarters),
    });
  }

  for (const l of lcdas) {
    docs.push({
      id: `lcda-${l.slug}`,
      type: "lcda",
      title: l.name,
      subtitle: `LCDA · ${titleFromSlug(l.parentLgaSlug)}`,
      href: `/lcdas/${l.slug}`,
      weight: 74,
      keywords: haystack(
        l.name,
        "lcda local council development area",
        titleFromSlug(l.parentLgaSlug),
      ),
    });
  }

  for (const w of wards) {
    docs.push({
      id: `ward-${w.slug}`,
      type: "ward",
      title: w.name,
      subtitle: `Ward · ${titleFromSlug(w.lgaSlug)}`,
      href: `/wards#${w.slug}`,
      weight: 60,
      keywords: haystack(w.name, w.code, "ward", titleFromSlug(w.lgaSlug)),
    });
  }

  for (const d of districts) {
    docs.push({
      id: `district-${d.slug}`,
      type: "constituency",
      title: d.name,
      subtitle: "Senatorial district",
      href: `/constituencies#${d.slug}`,
      weight: 72,
      keywords: haystack(d.name, "senatorial district senate", d.description),
    });
  }

  for (const f of federal) {
    docs.push({
      id: `fed-${f.slug}`,
      type: "constituency",
      title: f.name,
      subtitle: "Federal constituency",
      href: `/constituencies#${f.slug}`,
      weight: 70,
      keywords: haystack(f.name, "federal constituency house of representatives"),
    });
  }

  for (const s of state) {
    docs.push({
      id: `state-${s.slug}`,
      type: "constituency",
      title: s.name,
      subtitle: "State constituency",
      href: `/constituencies#${s.slug}`,
      weight: 70,
      keywords: haystack(s.name, "state constituency house of assembly"),
    });
  }

  for (const n of news) {
    docs.push({
      id: `news-${n.slug}`,
      type: "news",
      title: n.title,
      subtitle: titleFromSlug(n.category),
      description: n.excerpt,
      href: `/news/${n.slug}`,
      image: n.cover,
      weight: 76,
      keywords: haystack(n.title, n.excerpt, n.category, n.tags),
    });
  }

  for (const e of events) {
    docs.push({
      id: `event-${e.slug}`,
      type: "event",
      title: e.title,
      subtitle: e.venueName,
      description: e.summary,
      href: `/events/${e.slug}`,
      image: e.cover,
      weight: 74,
      keywords: haystack(e.title, e.summary, e.venueName, e.venueAddress),
    });
  }

  for (const a of albums) {
    docs.push({
      id: `album-${a.slug}`,
      type: "gallery",
      title: a.title,
      subtitle: "Photo album",
      description: a.description,
      href: `/gallery/${a.slug}`,
      image: a.cover,
      weight: 66,
      keywords: haystack(a.title, a.description, a.category, a.location),
    });
  }

  for (const v of videos) {
    docs.push({
      id: `video-${v.slug}`,
      type: "video",
      title: v.title,
      subtitle: "Video",
      description: v.description,
      href: `/media/${v.slug}`,
      weight: 64,
      keywords: haystack(v.title, v.description, v.category),
    });
  }

  for (const d of documents) {
    docs.push({
      id: `document-${d.slug}`,
      type: "document",
      title: d.title,
      subtitle: `${d.fileType.toUpperCase()} document`,
      description: d.description,
      href: d.fileUrl,
      weight: 62,
      keywords: haystack(d.title, d.description, d.category),
    });
  }

  cached = docs;
  return docs;
}

export interface SearchResultGroup {
  type: SearchDocument["type"];
  label: string;
  results: SearchDocument[];
}

const TYPE_LABELS: Record<SearchDocument["type"], string> = {
  page: "Pages",
  person: "People",
  candidate: "Candidates",
  lga: "Local Government Areas",
  lcda: "LCDAs",
  ward: "Wards",
  constituency: "Constituencies",
  news: "News",
  event: "Events",
  gallery: "Gallery",
  video: "Videos",
  document: "Documents",
};

export function labelForType(type: SearchDocument["type"]) {
  return TYPE_LABELS[type];
}

/**
 * Scores a query against the index. Deliberately simple and dependency-free:
 * exact title match > title prefix > title contains > keyword contains, each
 * tie-broken by the document's own weight.
 */
export function searchIndex(
  index: SearchDocument[],
  rawQuery: string,
  limit = 60,
): SearchDocument[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];

  const terms = query.split(/\s+/).filter(Boolean).slice(0, 8);
  const patterns = terms.map(
    (t) => new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(t)}`, "i"),
  );

  const scored = index
    .map((doc) => {
      const title = doc.title.toLowerCase();
      let score = 0;

      if (title === query) score += 1000;
      else if (title.startsWith(query)) score += 600;
      else if (title.includes(query)) score += 400;
      else if (doc.keywords.includes(query)) score += 220;

      for (const pattern of patterns) {
        if (pattern.test(title)) score += 90;
        else if (pattern.test(doc.keywords)) score += 40;
      }

      // Require every term to appear somewhere, so multi-word queries narrow.
      const allTermsPresent = terms.every(
        (t) => title.includes(t) || doc.keywords.includes(t),
      );
      if (!allTermsPresent) score = 0;

      return { doc, score: score > 0 ? score + doc.weight / 10 : 0 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.doc);
}

export function groupResults(results: SearchDocument[]): SearchResultGroup[] {
  const order: SearchDocument["type"][] = [
    "person",
    "candidate",
    "lga",
    "lcda",
    "constituency",
    "ward",
    "news",
    "event",
    "gallery",
    "video",
    "document",
    "page",
  ];
  return order
    .map((type) => ({
      type,
      label: TYPE_LABELS[type],
      results: results.filter((r) => r.type === type),
    }))
    .filter((g) => g.results.length > 0);
}
