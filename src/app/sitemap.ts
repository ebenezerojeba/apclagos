import type { MetadataRoute } from "next";
import {
  getCandidates,
  getElections,
  getEvents,
  getGalleryAlbums,
  getLcdas,
  getLeaders,
  getLgas,
  getNews,
  getRepresentatives,
  getVideos,
} from "@/lib/content";
import { siteConfig } from "@/data/site";

/**
 * Sitemap.
 *
 * Every indexable route is derived from the content repository, so a new record
 * appears in the sitemap the moment it is published — there is no second list to
 * keep in step. Search, admin and API routes are excluded here and disallowed in
 * robots.txt.
 */

const base = siteConfig.url;

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified?: string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${base}${path}`,
    lastModified: lastModified ? new Date(lastModified) : new Date(),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    lgas,
    lcdas,
    leaders,
    representatives,
    candidates,
    elections,
    news,
    events,
    albums,
    videos,
  ] = await Promise.all([
    getLgas(),
    getLcdas(),
    getLeaders(),
    getRepresentatives(),
    getCandidates(),
    getElections(),
    getNews(),
    getEvents(),
    getGalleryAlbums(),
    getVideos(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", "daily", 1),
    entry("/about", "monthly", 0.8),
    entry("/structure", "monthly", 0.8),
    entry("/leadership", "weekly", 0.9),
    entry("/councils", "weekly", 0.9),
    entry("/lgas", "monthly", 0.8),
    entry("/lcdas", "monthly", 0.8),
    entry("/wards", "monthly", 0.6),
    entry("/constituencies", "monthly", 0.7),
    entry("/representatives", "weekly", 0.9),
    entry("/representatives/senate", "weekly", 0.8),
    entry("/representatives/house-of-representatives", "weekly", 0.8),
    entry("/representatives/house-of-assembly", "weekly", 0.8),
    entry("/candidates", "weekly", 0.9),
    entry("/elections", "monthly", 0.7),
    entry("/news", "daily", 0.9),
    entry("/events", "daily", 0.8),
    entry("/achievements", "weekly", 0.7),
    entry("/gallery", "weekly", 0.7),
    entry("/media", "weekly", 0.7),
    entry("/documents", "monthly", 0.6),
    entry("/contact", "yearly", 0.6),
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...lgas.map((lga) => entry(`/lgas/${lga.slug}`, "monthly", 0.7, lga.updatedAt)),
    ...lcdas.map((lcda) =>
      entry(`/lcdas/${lcda.slug}`, "monthly", 0.7, lcda.updatedAt),
    ),
    ...leaders.map((leader) =>
      entry(`/leadership/${leader.slug}`, "monthly", 0.7, leader.updatedAt),
    ),
    ...representatives.map((member) => {
      const chamber =
        member.kind === "senator"
          ? "senate"
          : member.kind === "house-of-representatives"
            ? "house-of-representatives"
            : "house-of-assembly";
      return entry(
        `/representatives/${chamber}/${member.slug}`,
        "monthly",
        0.7,
        member.updatedAt,
      );
    }),
    ...candidates.map((candidate) =>
      entry(`/candidates/${candidate.slug}`, "weekly", 0.8, candidate.updatedAt),
    ),
    ...elections.map((election) =>
      entry(`/elections/${election.slug}`, "weekly", 0.8, election.updatedAt),
    ),
    ...news.map((article) =>
      entry(
        `/news/${article.slug}`,
        "monthly",
        0.7,
        article.updatedAt ?? article.publishedAt,
      ),
    ),
    ...events.map((event) =>
      entry(`/events/${event.slug}`, "weekly", 0.7, event.updatedAt),
    ),
    ...albums.map((album) =>
      entry(`/gallery/${album.slug}`, "monthly", 0.6, album.updatedAt),
    ),
    ...videos.map((video) =>
      entry(`/media/${video.slug}`, "monthly", 0.6, video.updatedAt),
    ),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
