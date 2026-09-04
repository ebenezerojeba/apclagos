import "server-only";

import {
  federalConstituencies,
  geographyCounts,
  lcdas,
  lgas,
  senatorialDistricts,
  stateConstituencies,
} from "@/data/geography";
import {
  readCandidates,
  readCouncilOfficials,
  readHouseOfAssembly,
  readHouseOfRepresentatives,
  readLeaders,
  readSenators,
} from "@/lib/cms";
import { elections } from "@/data/elections";
import { newsArticles, partyEvents } from "@/data/editorial";
import { galleryAlbums, videos } from "@/data/media";
import { achievements, partyDocuments, wards } from "@/data/resources";
import { byOrderThenName } from "@/lib/utils";
import type {
  Achievement,
  BaseRecord,
  Candidate,
  Chamber,
  Council,
  CouncilOfficial,
  Election,
  ElectionOffice,
  FederalConstituency,
  GalleryAlbum,
  HouseOfAssemblyMember,
  HouseOfRepresentativesMember,
  Leader,
  LeadershipBody,
  LocalCouncilDevelopmentArea,
  LocalGovernmentArea,
  NewsArticle,
  NewsCategorySlug,
  PartyDocument,
  PartyEvent,
  Representative,
  SenatorialDistrict,
  Senator,
  Slug,
  StateConstituency,
  Video,
  Ward,
} from "@/types/content";

/**
 * The content repository — the single boundary between the site and its data.
 *
 * People records are read from the CMS (`src/lib/cms.ts`, backed by JSON in
 * `content/people/**`). Everything else still reads the typed files in
 * `src/data`. Because the whole
 * surface is async and returns plain serialisable objects, switching to a
 * Node/Express + database API later means changing only the bodies of these
 * functions:
 *
 *   const res = await fetch(`${process.env.CONTENT_API_URL}/leaders`, {
 *     headers: { authorization: `Bearer ${process.env.CONTENT_API_TOKEN}` },
 *     next: { revalidate: 300, tags: ["leaders"] },
 *   });
 *
 * No page or component needs to change. `import "server-only"` guarantees the
 * data source (and any future API token) can never be bundled into the client.
 */

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Only published records ever reach the public site. */
function published<T extends BaseRecord>(records: T[]): T[] {
  return records.filter((r) => r.status === "published");
}

function bySlug<T extends BaseRecord>(records: T[], slug: Slug): T | undefined {
  return records.find((r) => r.slug === slug);
}

function newestFirst<T extends { publishedAt?: string; createdAt?: string }>(
  a: T,
  b: T,
) {
  const av = a.publishedAt ?? a.createdAt ?? "";
  const bv = b.publishedAt ?? b.createdAt ?? "";
  return bv.localeCompare(av);
}

/* -------------------------------------------------------------------------- */
/*  Leadership                                                                 */
/* -------------------------------------------------------------------------- */

export async function getLeaders(body?: LeadershipBody): Promise<Leader[]> {
  const list = published(await readLeaders()).sort(byOrderThenName);
  return body ? list.filter((l) => l.body === body) : list;
}

export async function getFeaturedLeaders(limit = 6): Promise<Leader[]> {
  const list = await getLeaders();
  const featured = list.filter((l) => l.featured);
  return (featured.length > 0 ? featured : list).slice(0, limit);
}

export async function getLeaderBySlug(slug: Slug): Promise<Leader | undefined> {
  return bySlug(published(await readLeaders()), slug);
}

/** Distinct leadership bodies that actually have published members. */
export async function getPopulatedLeadershipBodies(): Promise<LeadershipBody[]> {
  const list = await getLeaders();
  return Array.from(new Set(list.map((l) => l.body)));
}

/* -------------------------------------------------------------------------- */
/*  Councils (LGAs + LCDAs)                                                    */
/* -------------------------------------------------------------------------- */

export async function getLgas(): Promise<LocalGovernmentArea[]> {
  return published(lgas).sort(byOrderThenName);
}

export async function getLcdas(): Promise<LocalCouncilDevelopmentArea[]> {
  return published(lcdas).sort(byOrderThenName);
}

/** Every local council, both tiers, for the combined directory. */
export async function getCouncils(): Promise<Council[]> {
  const [a, b] = await Promise.all([getLgas(), getLcdas()]);
  return [...a, ...b].sort((x, y) => x.name.localeCompare(y.name));
}

export async function getLgaBySlug(
  slug: Slug,
): Promise<LocalGovernmentArea | undefined> {
  return bySlug(published(lgas), slug);
}

export async function getLcdaBySlug(
  slug: Slug,
): Promise<LocalCouncilDevelopmentArea | undefined> {
  return bySlug(published(lcdas), slug);
}

/** LCDAs carved out of a given LGA. */
export async function getLcdasForLga(
  lgaSlug: Slug,
): Promise<LocalCouncilDevelopmentArea[]> {
  return (await getLcdas()).filter((l) => l.parentLgaSlug === lgaSlug);
}

export async function getCouncilOfficials(
  councilSlug?: Slug,
): Promise<CouncilOfficial[]> {
  const list = published(await readCouncilOfficials()).sort(byOrderThenName);
  return councilSlug
    ? list.filter((o) => o.councilSlug === councilSlug)
    : list;
}

export async function getChairmanForCouncil(
  councilSlug: Slug,
): Promise<CouncilOfficial | undefined> {
  const officials = await getCouncilOfficials(councilSlug);
  return officials.find((o) => o.councilRole === "Chairman");
}

/** Chairmen keyed by council slug — one pass for a whole directory page. */
export async function getChairmenByCouncil(): Promise<
  Record<Slug, CouncilOfficial>
> {
  const officials = await getCouncilOfficials();
  return officials.reduce<Record<Slug, CouncilOfficial>>((acc, o) => {
    if (o.councilRole === "Chairman") acc[o.councilSlug] = o;
    return acc;
  }, {});
}

/* -------------------------------------------------------------------------- */
/*  Constituencies & wards                                                     */
/* -------------------------------------------------------------------------- */

export async function getSenatorialDistricts(): Promise<SenatorialDistrict[]> {
  return published(senatorialDistricts).sort(byOrderThenName);
}

export async function getFederalConstituencies(): Promise<FederalConstituency[]> {
  return published(federalConstituencies).sort(byOrderThenName);
}

export async function getStateConstituencies(): Promise<StateConstituency[]> {
  return published(stateConstituencies).sort(byOrderThenName);
}

export async function getWards(lgaSlug?: Slug): Promise<Ward[]> {
  const list = published(wards).sort(byOrderThenName);
  return lgaSlug ? list.filter((w) => w.lgaSlug === lgaSlug) : list;
}

export async function getGeographyCounts() {
  return { ...geographyCounts, wards: published(wards).length };
}

/* -------------------------------------------------------------------------- */
/*  Representatives                                                            */
/* -------------------------------------------------------------------------- */

export async function getSenators(): Promise<Senator[]> {
  return published(await readSenators()).sort(byOrderThenName);
}

export async function getHouseOfRepresentativesMembers(): Promise<
  HouseOfRepresentativesMember[]
> {
  return published(await readHouseOfRepresentatives()).sort(byOrderThenName);
}

export async function getHouseOfAssemblyMembers(): Promise<
  HouseOfAssemblyMember[]
> {
  return published(await readHouseOfAssembly()).sort(byOrderThenName);
}

export async function getRepresentatives(
  chamber?: Chamber,
): Promise<Representative[]> {
  if (chamber === "senate") return getSenators();
  if (chamber === "house-of-representatives")
    return getHouseOfRepresentativesMembers();
  if (chamber === "house-of-assembly") return getHouseOfAssemblyMembers();
  const [s, r, a] = await Promise.all([
    getSenators(),
    getHouseOfRepresentativesMembers(),
    getHouseOfAssemblyMembers(),
  ]);
  return [...s, ...r, ...a];
}

export async function getRepresentativeBySlug(
  slug: Slug,
): Promise<Representative | undefined> {
  return (await getRepresentatives()).find((r) => r.slug === slug);
}

/* -------------------------------------------------------------------------- */
/*  Elections & candidates                                                     */
/* -------------------------------------------------------------------------- */

export async function getElections(): Promise<Election[]> {
  return published(elections).sort((a, b) => b.year - a.year);
}

export async function getElectionBySlug(
  slug: Slug,
): Promise<Election | undefined> {
  return bySlug(published(elections), slug);
}

export interface CandidateFilters {
  electionSlug?: Slug;
  office?: ElectionOffice;
  senatorialDistrictSlug?: Slug;
  federalConstituencySlug?: Slug;
  stateConstituencySlug?: Slug;
  lgaSlug?: Slug;
  wardSlug?: Slug;
}

export async function getCandidates(
  filters: CandidateFilters = {},
): Promise<Candidate[]> {
  return published(await readCandidates())
    .filter((c) =>
      (Object.keys(filters) as (keyof CandidateFilters)[]).every((key) => {
        const wanted = filters[key];
        return wanted === undefined || c[key] === wanted;
      }),
    )
    .sort(byOrderThenName);
}

export async function getCandidateBySlug(
  slug: Slug,
): Promise<Candidate | undefined> {
  return bySlug(published(await readCandidates()), slug);
}

export async function getFeaturedCandidates(limit = 4): Promise<Candidate[]> {
  const list = await getCandidates();
  const featured = list.filter((c) => c.featured);
  return (featured.length > 0 ? featured : list).slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/*  News                                                                       */
/* -------------------------------------------------------------------------- */

export async function getNews(category?: NewsCategorySlug): Promise<NewsArticle[]> {
  const list = published(newsArticles).sort(newestFirst);
  return category ? list.filter((n) => n.category === category) : list;
}

export async function getFeaturedNews(): Promise<NewsArticle | undefined> {
  const list = await getNews();
  return list.find((n) => n.featured) ?? list[0];
}

export async function getLatestNews(limit = 6): Promise<NewsArticle[]> {
  return (await getNews()).slice(0, limit);
}

export async function getPopularNews(limit = 5): Promise<NewsArticle[]> {
  return [...(await getNews())]
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, limit);
}

export async function getNewsBySlug(slug: Slug): Promise<NewsArticle | undefined> {
  return bySlug(published(newsArticles), slug);
}

export async function getRelatedNews(
  article: NewsArticle,
  limit = 3,
): Promise<NewsArticle[]> {
  const all = (await getNews()).filter((n) => n.slug !== article.slug);
  const explicit = (article.relatedArticleSlugs ?? [])
    .map((slug) => all.find((n) => n.slug === slug))
    .filter((n): n is NewsArticle => Boolean(n));
  const sameCategory = all.filter((n) => n.category === article.category);
  const merged = [...explicit, ...sameCategory, ...all];
  return Array.from(new Map(merged.map((n) => [n.slug, n])).values()).slice(
    0,
    limit,
  );
}

/* -------------------------------------------------------------------------- */
/*  Events                                                                     */
/* -------------------------------------------------------------------------- */

export async function getEvents(): Promise<PartyEvent[]> {
  return published(partyEvents).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getUpcomingEvents(limit?: number): Promise<PartyEvent[]> {
  const now = Date.now();
  const list = (await getEvents()).filter(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= now,
  );
  return limit ? list.slice(0, limit) : list;
}

export async function getPastEvents(limit?: number): Promise<PartyEvent[]> {
  const now = Date.now();
  const list = (await getEvents())
    .filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() < now)
    .reverse();
  return limit ? list.slice(0, limit) : list;
}

export async function getEventBySlug(slug: Slug): Promise<PartyEvent | undefined> {
  return bySlug(published(partyEvents), slug);
}

/* -------------------------------------------------------------------------- */
/*  Media                                                                      */
/* -------------------------------------------------------------------------- */

export async function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  return published(galleryAlbums).sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
}

export async function getGalleryAlbumBySlug(
  slug: Slug,
): Promise<GalleryAlbum | undefined> {
  return bySlug(published(galleryAlbums), slug);
}

export async function getVideos(): Promise<Video[]> {
  return published(videos).sort(newestFirst);
}

export async function getVideoBySlug(slug: Slug): Promise<Video | undefined> {
  return bySlug(published(videos), slug);
}

/* -------------------------------------------------------------------------- */
/*  Achievements & documents                                                   */
/* -------------------------------------------------------------------------- */

export async function getAchievements(): Promise<Achievement[]> {
  return published(achievements).sort(
    (a, b) => (b.year ?? 0) - (a.year ?? 0) || byOrderThenName(a, b),
  );
}

export async function getDocuments(): Promise<PartyDocument[]> {
  return published(partyDocuments).sort(newestFirst);
}
