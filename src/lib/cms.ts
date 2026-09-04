import "server-only";

import { cache } from "react";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import type {
  Candidate,
  CouncilOfficial,
  HouseOfAssemblyMember,
  HouseOfRepresentativesMember,
  ImageAsset,
  Leader,
  Person,
  Senator,
} from "@/types/content";
import { lgas } from "@/data/geography";

/**
 * Reads the records an editor manages in Keystatic and maps them onto the
 * site's own domain types.
 *
 * This is the seam. Every page and component still consumes `Leader`,
 * `Senator`, `Candidate` and friends exactly as before — nothing downstream
 * knows the content moved out of TypeScript files and into JSON managed by a
 * CMS. `src/lib/content.ts` is the only consumer of this module.
 *
 * `import "server-only"` matters here: the reader touches the filesystem, and
 * this must never be pulled into a client bundle.
 */

const reader = createReader(process.cwd(), keystaticConfig);

/** A Keystatic entry as returned by `collection.all()`. */
type Entry<T> = { slug: string; entry: T };

/* -------------------------------------------------------------------------- */
/*  Mapping                                                                    */
/* -------------------------------------------------------------------------- */

type SharedEntry = {
  name: string;
  status: string;
  honorific: string;
  postNominals: string;
  position: string;
  shortPosition: string;
  jurisdiction: string;
  summary: string;
  portrait: string | null;
  portraitAlt: string;
  portraitFocal: string;
  biography: readonly string[];
  careerHighlights: readonly string[];
  previousPositions: readonly string[];
  committees: readonly string[];
  education: readonly string[];
  tenureStart: string | null;
  social: {
    x: string | null;
    facebook: string | null;
    instagram: string | null;
    linkedin: string | null;
  };
  email: string;
  phone: string;
  order: number | null;
};

/** Empty strings are how a cleared text field arrives; treat them as absent. */
function text(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function list(value: readonly string[] | undefined): string[] | undefined {
  const items = (value ?? []).map((v) => v.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function portraitOf(entry: SharedEntry, displayName: string): ImageAsset | undefined {
  if (!entry.portrait) return undefined;
  return {
    src: entry.portrait,
    // A missing description is a real accessibility gap, so fall back to
    // something truthful and specific rather than to an empty string.
    alt: text(entry.portraitAlt) ?? `Portrait of ${displayName}`,
    width: 900,
    height: 1200,
    focal: (entry.portraitFocal as ImageAsset["focal"]) ?? "top",
    role: "portrait",
  };
}

function toPerson(
  slug: string,
  entry: SharedEntry,
  kind: Person["kind"],
): Person {
  const displayName = [text(entry.honorific), entry.name]
    .filter(Boolean)
    .join(" ");

  const emails = text(entry.email) ? [text(entry.email)!] : undefined;
  const phones = text(entry.phone) ? [text(entry.phone)!] : undefined;

  const social = {
    x: text(entry.social?.x ?? undefined),
    facebook: text(entry.social?.facebook ?? undefined),
    instagram: text(entry.social?.instagram ?? undefined),
    linkedin: text(entry.social?.linkedin ?? undefined),
  };
  const hasSocial = Object.values(social).some(Boolean);

  return {
    id: slug,
    slug,
    kind,
    status: (entry.status as Person["status"]) ?? "draft",
    order: entry.order ?? undefined,
    name: entry.name,
    honorific: text(entry.honorific),
    postNominals: text(entry.postNominals),
    position: entry.position,
    shortPosition: text(entry.shortPosition),
    jurisdiction: text(entry.jurisdiction),
    summary: text(entry.summary),
    portrait: portraitOf(entry, displayName),
    biography: list(entry.biography),
    careerHighlights: list(entry.careerHighlights),
    previousPositions: list(entry.previousPositions),
    committees: list(entry.committees),
    education: list(entry.education),
    tenureStart: entry.tenureStart ?? undefined,
    social: hasSocial ? social : undefined,
    contact: emails || phones ? { emails, phones } : undefined,
  };
}

/**
 * Reads a collection, mapping each entry and dropping any that fail.
 *
 * A single malformed record must not take the whole directory down with it —
 * on a public information site a missing profile is far better than a 500.
 */
async function readCollection<TEntry, TOut>(
  name: string,
  load: () => Promise<Entry<TEntry>[]>,
  map: (slug: string, entry: TEntry) => TOut,
): Promise<TOut[]> {
  let entries: Entry<TEntry>[];
  try {
    entries = await load();
  } catch (error) {
    console.error(`[cms] Could not read the "${name}" collection.`, error);
    return [];
  }

  const out: TOut[] = [];
  for (const { slug, entry } of entries) {
    try {
      out.push(map(slug, entry));
    } catch (error) {
      console.error(`[cms] Skipping malformed "${name}" record "${slug}".`, error);
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Collections                                                                */
/* -------------------------------------------------------------------------- */

/*
 * Each reader is wrapped in `cache()` so a page that asks for the same
 * collection more than once during a render reads the filesystem once. The
 * memo is per request, so a record published a moment ago is never served from
 * a stale process-level copy.
 */

export const readLeaders = cache(async (): Promise<Leader[]> => {
  return readCollection(
    "leaders",
    () => reader.collections.leaders.all(),
    (slug, entry) => ({
      ...toPerson(slug, entry as unknown as SharedEntry, "leader"),
      kind: "leader",
      body: entry.body,
      featured: entry.featured,
    }),
  );
});

export const readCouncilOfficials = cache(async (): Promise<CouncilOfficial[]> => {
  const lgaSlugs = new Set(lgas.map((l) => l.slug));

  return readCollection(
    "council officials",
    () => reader.collections.councilOfficials.all(),
    (slug, entry) => ({
      ...toPerson(slug, entry as unknown as SharedEntry, "chairman"),
      kind: entry.councilRole === "Chairman" ? "chairman" : "official",
      councilSlug: entry.councilSlug,
      // Derived rather than asked for: the editor picks one council from a
      // single list, and which tier it belongs to is already known here.
      councilType: lgaSlugs.has(entry.councilSlug) ? "LGA" : "LCDA",
      councilRole: entry.councilRole,
    }),
  );
});

export const readSenators = cache(async (): Promise<Senator[]> => {
  return readCollection(
    "senators",
    () => reader.collections.senators.all(),
    (slug, entry) => ({
      ...toPerson(slug, entry as unknown as SharedEntry, "senator"),
      kind: "senator",
      senatorialDistrictSlug: entry.senatorialDistrictSlug,
    }),
  );
});

export const readHouseOfRepresentatives = cache(
  async (): Promise<HouseOfRepresentativesMember[]> => {
    return readCollection(
      "House of Representatives",
      () => reader.collections.houseOfRepresentatives.all(),
      (slug, entry) => ({
        ...toPerson(
          slug,
          entry as unknown as SharedEntry,
          "house-of-representatives",
        ),
        kind: "house-of-representatives",
        federalConstituencySlug: entry.federalConstituencySlug,
        senatorialDistrictSlug: entry.senatorialDistrictSlug,
      }),
    );
  },
);

export const readHouseOfAssembly = cache(
  async (): Promise<HouseOfAssemblyMember[]> => {
    return readCollection(
      "House of Assembly",
      () => reader.collections.houseOfAssembly.all(),
      (slug, entry) => ({
        ...toPerson(slug, entry as unknown as SharedEntry, "house-of-assembly"),
        kind: "house-of-assembly",
        stateConstituencySlug: entry.stateConstituencySlug,
        lgaSlug: entry.lgaSlug,
      }),
    );
  },
);

export const readCandidates = cache(async (): Promise<Candidate[]> => {
  return readCollection(
    "candidates",
    () => reader.collections.candidates.all(),
    (slug, entry) => ({
      ...toPerson(slug, entry as unknown as SharedEntry, "candidate"),
      kind: "candidate",
      electionSlug: entry.electionSlug,
      office: entry.office,
      contestedSeat: text(entry.contestedSeat),
      featured: entry.featured,
    }),
  );
});
