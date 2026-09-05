import "server-only";

import { cache } from "react";
import { safeRead } from "./db";
import { Article, EventModel, Category, Person } from "./models";
import type { ArticleDoc, EventDoc, PersonDoc } from "./models";
import type { CloudinaryImage, ContentBlock } from "./models";
import { lgas } from "@/data/geography";
import type {
  ArticleBlock,
  Candidate,
  CouncilOfficial,
  HouseOfAssemblyMember,
  HouseOfRepresentativesMember,
  ImageAsset,
  Leader,
  NewsArticle,
  NewsCategorySlug,
  PartyEvent,
  Person as DomainPerson,
  Senator,
} from "@/types/content";

/**
 * The MongoDB read layer.
 *
 * This is the seam between the database and the rest of the application.
 * Everything above it — every page, card and directory — still consumes the
 * domain types in `src/types/content.ts` and knows nothing about Mongoose.
 * That is what made replacing the file-and-Git backend a change to one layer
 * rather than to a hundred components.
 *
 * Three rules hold throughout:
 *
 *  - **Reads never throw.** `safeRead` returns an empty result if the database
 *    is unreachable or unconfigured, so a connection blip renders an empty
 *    state rather than a 500 across the site. Writes deliberately do not do
 *    this: an administrator must see a failed save.
 *  - **Only `published` records leave this file.** Draft and archived content
 *    is filtered in the query, not in the component, so it cannot leak through
 *    a caller that forgets to check.
 *  - **`cache()` deduplicates within a request.** The homepage asks for people
 *    from four different sections; without this that is four identical round
 *    trips per render.
 */

/* -------------------------------------------------------------------------- */
/*  Mapping                                                                    */
/* -------------------------------------------------------------------------- */

function toImageAsset(image?: CloudinaryImage | null): ImageAsset | undefined {
  if (!image?.secureUrl) return undefined;
  return {
    src: image.secureUrl,
    alt: image.alt ?? "",
    width: image.width,
    height: image.height,
    focal: image.focal,
    caption: image.caption,
    credit: image.credit,
  };
}

/** Maps the stored block model onto the renderer's closed union. */
function toBlocks(blocks: ContentBlock[] = []): ArticleBlock[] {
  const out: ArticleBlock[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        if (block.text) out.push({ type: "paragraph", text: block.text });
        break;
      case "heading":
        if (block.text) {
          out.push({ type: "heading", level: block.level === 3 ? 3 : 2, text: block.text });
        }
        break;
      case "list":
        if (block.items?.length) {
          out.push({ type: "list", ordered: block.ordered, items: block.items });
        }
        break;
      case "quote":
        if (block.text) {
          out.push({ type: "quote", text: block.text, attribution: block.attribution });
        }
        break;
      case "image": {
        const image = toImageAsset(block.image);
        if (image) out.push({ type: "image", image });
        break;
      }
      case "video":
        if (block.videoRef) {
          out.push({
            type: "video",
            title: block.title,
            video: { provider: block.videoProvider ?? "youtube", ref: block.videoRef },
          });
        }
        break;
    }
  }
  return out;
}

const lgaName = (slug?: string) =>
  lgas.find((l) => l.slug === slug)?.name ?? undefined;

/** Fields every person type shares. */
function toBasePerson(doc: PersonDoc): DomainPerson {
  return {
    id: String(doc._id),
    slug: doc.slug,
    status: doc.status,
    order: doc.order,
    kind: doc.kind as DomainPerson["kind"],
    name: doc.name,
    honorific: doc.honorific || undefined,
    postNominals: doc.postNominals || undefined,
    position: doc.position,
    shortPosition: doc.shortPosition || undefined,
    summary: doc.summary || undefined,
    biography: doc.biography?.length ? doc.biography : undefined,
    portrait: toImageAsset(doc.portrait),
    jurisdiction: doc.jurisdiction || undefined,
    lgaSlug: doc.lgaSlug || undefined,
    lcdaSlug: doc.lcdaSlug || undefined,
    senatorialDistrictSlug: doc.senatorialDistrictSlug || undefined,
    federalConstituencySlug: doc.federalConstituencySlug || undefined,
    stateConstituencySlug: doc.stateConstituencySlug || undefined,
    tenureStart: doc.tenureStart?.toISOString(),
    tenureEnd: doc.tenureEnd?.toISOString(),
    education: doc.education?.length ? doc.education : undefined,
    careerHighlights: doc.careerHighlights?.length ? doc.careerHighlights : undefined,
    previousPositions: doc.previousPositions?.length ? doc.previousPositions : undefined,
    committees: doc.committees?.length ? doc.committees : undefined,
    tags: doc.tags?.length ? doc.tags : undefined,
    social: doc.social,
    contact:
      doc.email || doc.phone
        ? {
            emails: doc.email ? [doc.email] : undefined,
            phones: doc.phone ? [doc.phone] : undefined,
          }
        : undefined,
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

function toArticle(doc: ArticleDoc & { category?: { slug?: string } | null }): NewsArticle {
  const categorySlug =
    (doc.category && typeof doc.category === "object" && "slug" in doc.category
      ? doc.category.slug
      : undefined) ?? "apc-lagos";

  return {
    id: String(doc._id),
    slug: doc.slug,
    status: doc.status,
    title: doc.title,
    kicker: doc.kicker || undefined,
    excerpt: doc.excerpt,
    category: categorySlug as NewsCategorySlug,
    tags: doc.tags?.length ? doc.tags : undefined,
    author: doc.authorName
      ? { name: doc.authorName, role: doc.authorRole || undefined }
      : undefined,
    publishedAt: (doc.publishedAt ?? doc.createdAt).toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
    cover: toImageAsset(doc.cover),
    body: toBlocks(doc.body),
    featured: doc.featured,
    popularity: doc.popularity,
  };
}

function toEvent(doc: EventDoc): PartyEvent {
  return {
    id: String(doc._id),
    slug: doc.slug,
    status: doc.status,
    title: doc.title,
    summary: doc.summary,
    category: doc.category,
    startsAt: doc.startsAt.toISOString(),
    endsAt: doc.endsAt?.toISOString(),
    venueName: doc.venueName || undefined,
    venueAddress: doc.venueAddress || undefined,
    lgaSlug: doc.lgaSlug || undefined,
    registrationUrl: doc.registrationUrl || undefined,
    notice: doc.notice || undefined,
    cover: toImageAsset(doc.cover),
    description: doc.body?.length ? toBlocks(doc.body) : undefined,
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  People                                                                     */
/* -------------------------------------------------------------------------- */

const PUBLISHED = { status: "published" as const };

/**
 * Every published person, fetched once per request and filtered in memory.
 *
 * The whole set is a few hundred small documents at most — one indexed query
 * costs less than the seven separate ones the homepage would otherwise fire.
 */
const allPeople = cache(async (): Promise<PersonDoc[]> =>
  safeRead(
    () =>
      Person.find(PUBLISHED)
        .sort({ order: 1, name: 1 })
        .lean<PersonDoc[]>()
        .exec(),
    [],
    "people",
  ),
);

export async function fetchLeaders(): Promise<Leader[]> {
  const people = await allPeople();
  return people
    .filter((p) => p.kind === "leader")
    .map((doc) => ({
      ...toBasePerson(doc),
      kind: "leader" as const,
      body: (doc.body ?? "party-organ") as Leader["body"],
      featured: doc.featured,
    }));
}

export async function fetchCouncilOfficials(): Promise<CouncilOfficial[]> {
  const people = await allPeople();
  return people
    .filter((p) => p.kind === "chairman" || p.kind === "official")
    .map((doc) => ({
      ...toBasePerson(doc),
      kind: doc.kind as "chairman" | "official",
      councilSlug: doc.councilSlug ?? "",
      councilType: (doc.councilType ?? "LGA") as "LGA" | "LCDA",
      councilRole: (doc.councilRole ?? "Chairman") as CouncilOfficial["councilRole"],
      jurisdiction: doc.jurisdiction || lgaName(doc.lgaSlug),
    }));
}

export async function fetchSenators(): Promise<Senator[]> {
  const people = await allPeople();
  return people
    .filter((p) => p.kind === "senator")
    .map((doc) => ({
      ...toBasePerson(doc),
      kind: "senator" as const,
      senatorialDistrictSlug: doc.senatorialDistrictSlug ?? "",
    }));
}

export async function fetchHouseOfRepresentatives(): Promise<
  HouseOfRepresentativesMember[]
> {
  const people = await allPeople();
  return people
    .filter((p) => p.kind === "house-of-representatives")
    .map((doc) => ({
      ...toBasePerson(doc),
      kind: "house-of-representatives" as const,
      federalConstituencySlug: doc.federalConstituencySlug ?? "",
    }));
}

export async function fetchHouseOfAssembly(): Promise<HouseOfAssemblyMember[]> {
  const people = await allPeople();
  return people
    .filter((p) => p.kind === "house-of-assembly")
    .map((doc) => ({
      ...toBasePerson(doc),
      kind: "house-of-assembly" as const,
      stateConstituencySlug: doc.stateConstituencySlug ?? "",
    }));
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const people = await allPeople();
  return people
    .filter((p) => p.kind === "candidate")
    .map((doc) => ({
      ...toBasePerson(doc),
      kind: "candidate" as const,
      electionSlug: doc.electionSlug ?? "",
      office: (doc.office ?? "other") as Candidate["office"],
      contestedSeat: doc.contestedSeat || undefined,
      runningMateSlug: doc.runningMateSlug || undefined,
      manifesto: doc.manifesto?.length ? doc.manifesto : undefined,
      keyPriorities: doc.keyPriorities?.length ? doc.keyPriorities : undefined,
      featured: doc.featured,
    }));
}

/* -------------------------------------------------------------------------- */
/*  Editorial                                                                  */
/* -------------------------------------------------------------------------- */

export const fetchArticles = cache(async (): Promise<NewsArticle[]> => {
  const docs = await safeRead(
    () =>
      Article.find(PUBLISHED)
        .populate("category", "slug name")
        .sort({ publishedAt: -1 })
        .lean<(ArticleDoc & { category?: { slug?: string } })[]>()
        .exec(),
    [],
    "articles",
  );
  return docs.map(toArticle);
});

export const fetchEvents = cache(async (): Promise<PartyEvent[]> => {
  const docs = await safeRead(
    () =>
      EventModel.find(PUBLISHED)
        .sort({ startsAt: 1 })
        .lean<EventDoc[]>()
        .exec(),
    [],
    "events",
  );
  return docs.map(toEvent);
});

export const fetchCategories = cache(async () =>
  safeRead(
    () =>
      Category.find({})
        .sort({ order: 1, name: 1 })
        .lean<{ slug: string; name: string; description?: string }[]>()
        .exec(),
    [],
    "categories",
  ),
);
