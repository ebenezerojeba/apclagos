import "server-only";

import type { PersonInitial, PersonOptions } from "@/components/admin/PersonForm";
import type { ImageValue } from "@/components/admin/ImageField";
import type { Block } from "@/components/admin/BlockEditor";
import type { ArticleInitial } from "@/components/admin/ArticleFields";
import type { EventInitial } from "@/components/admin/EventFields";
import type { PageInitial } from "@/components/admin/PageFields";
import type { CloudinaryImage, ContentBlock } from "../models";
import {
  senatorialDistricts,
  federalConstituencies,
  stateConstituencies,
  lgas,
  lcdas,
} from "@/data/geography";
import { elections } from "@/data/elections";

/**
 * Turning documents into props a client component can receive.
 *
 * Anything crossing from a server component into a client one is serialised,
 * and a Mongoose document is not serialisable: it carries ObjectIds, Dates,
 * getters and an internal state machine. Passing one produces either a build
 * error or, worse, a silently mangled object. Everything here is converted to
 * strings, numbers, arrays and plain objects at that boundary.
 */

/** `YYYY-MM-DD`, which is what `<input type="date">` requires. */
export function toDateInput(value?: Date | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

/** `YYYY-MM-DDTHH:mm`, which is what `<input type="datetime-local">` requires. */
export function toDateTimeInput(value?: Date | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 16);
}

export function toImageValue(image?: CloudinaryImage | null): ImageValue | null {
  if (!image?.publicId) return null;
  return {
    url: image.url,
    secureUrl: image.secureUrl,
    publicId: image.publicId,
    width: image.width,
    height: image.height,
    format: image.format,
    alt: image.alt ?? "",
    caption: image.caption,
    credit: image.credit,
    focal: image.focal,
  };
}

export function toBlockValues(body?: ContentBlock[] | null): Block[] {
  if (!Array.isArray(body)) return [];
  return body.map((block) => ({
    type: block.type,
    text: block.text,
    level: block.level,
    ordered: block.ordered,
    items: block.items ? [...block.items] : undefined,
    attribution: block.attribution,
    image: toImageValue(block.image) ?? undefined,
    videoProvider: block.videoProvider,
    videoRef: block.videoRef,
    title: block.title,
  }));
}

/* -------------------------------------------------------------------------- */
/*  People                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The reference lists every person form needs.
 *
 * Read from `src/data/geography.ts` rather than the database on purpose: the
 * districts, constituencies and councils of Lagos are created by legislation,
 * not by editors. Keeping them in the repository means they cannot be mistyped
 * into existence, and every officeholder attached to one stays attached.
 */
export function personOptions(): PersonOptions {
  return {
    senatorialDistricts: senatorialDistricts.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
    })),
    federalConstituencies: federalConstituencies.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
    })),
    stateConstituencies: stateConstituencies.map((entry) => ({
      slug: entry.slug,
      name: entry.name,
    })),
    lgas: lgas.map((entry) => ({ slug: entry.slug, name: entry.name })),
    lcdas: lcdas.map((entry) => ({ slug: entry.slug, name: entry.name })),
    elections: elections.map((entry) => ({ slug: entry.slug, name: entry.name })),
  };
}

/** An empty record, so the create and edit screens share one form. */
export function blankPerson(kind = "leader"): PersonInitial {
  return {
    kind,
    slug: "",
    status: "draft",
    name: "",
    position: "",
    biography: [],
    featured: false,
    manifesto: [],
    education: [],
    careerHighlights: [],
    previousPositions: [],
    committees: [],
    tags: [],
    social: {},
    portrait: null,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toPersonInitial(doc: any): PersonInitial {
  return {
    id: String(doc._id),
    kind: doc.kind,
    slug: doc.slug ?? "",
    status: doc.status ?? "draft",
    order: doc.order ?? undefined,
    name: doc.name ?? "",
    honorific: doc.honorific ?? undefined,
    postNominals: doc.postNominals ?? undefined,
    position: doc.position ?? "",
    shortPosition: doc.shortPosition ?? undefined,
    summary: doc.summary ?? undefined,
    biography: Array.isArray(doc.biography) ? doc.biography.map(String) : [],
    portrait: toImageValue(doc.portrait),
    jurisdiction: doc.jurisdiction ?? undefined,
    senatorialDistrictSlug: doc.senatorialDistrictSlug ?? undefined,
    federalConstituencySlug: doc.federalConstituencySlug ?? undefined,
    stateConstituencySlug: doc.stateConstituencySlug ?? undefined,
    lgaSlug: doc.lgaSlug ?? undefined,
    lcdaSlug: doc.lcdaSlug ?? undefined,
    body: doc.body ?? undefined,
    featured: Boolean(doc.featured),
    councilSlug: doc.councilSlug ?? undefined,
    councilType: doc.councilType ?? undefined,
    councilRole: doc.councilRole ?? undefined,
    electionSlug: doc.electionSlug ?? undefined,
    office: doc.office ?? undefined,
    contestedSeat: doc.contestedSeat ?? undefined,
    runningMateSlug: doc.runningMateSlug ?? undefined,
    manifesto: Array.isArray(doc.manifesto) ? doc.manifesto.map(String) : [],
    tenureStart: toDateInput(doc.tenureStart),
    tenureEnd: toDateInput(doc.tenureEnd),
    education: Array.isArray(doc.education) ? doc.education.map(String) : [],
    careerHighlights: Array.isArray(doc.careerHighlights)
      ? doc.careerHighlights.map(String)
      : [],
    previousPositions: Array.isArray(doc.previousPositions)
      ? doc.previousPositions.map(String)
      : [],
    committees: Array.isArray(doc.committees) ? doc.committees.map(String) : [],
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    social: {
      facebook: doc.social?.facebook ?? undefined,
      x: doc.social?.x ?? undefined,
      instagram: doc.social?.instagram ?? undefined,
      linkedin: doc.social?.linkedin ?? undefined,
      youtube: doc.social?.youtube ?? undefined,
      website: doc.social?.website ?? undefined,
    },
    email: doc.email ?? undefined,
    phone: doc.phone ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  Editorial                                                                  */
/* -------------------------------------------------------------------------- */

export function blankArticle(): ArticleInitial {
  return {
    slug: "",
    status: "draft",
    title: "",
    summary: "",
    body: [],
    cover: null,
    type: "news",
    tags: [],
    featured: false,
  };
}

export function toArticleInitial(doc: any): ArticleInitial {
  return {
    id: String(doc._id),
    slug: doc.slug ?? "",
    status: doc.status ?? "draft",
    order: doc.order ?? undefined,
    title: doc.title ?? "",
    // The model calls this `excerpt`; the shared form calls every one-line
    // summary `summary`. The field name submitted is set separately, so the two
    // never have to agree beyond this line.
    summary: doc.excerpt ?? "",
    cover: toImageValue(doc.cover),
    body: toBlockValues(doc.body),
    type: doc.type ?? "news",
    kicker: doc.kicker ?? undefined,
    category: doc.category ? String(doc.category) : undefined,
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    authorName: doc.authorName ?? undefined,
    authorRole: doc.authorRole ?? undefined,
    featured: Boolean(doc.featured),
    publishedAt: toDateTimeInput(doc.publishedAt),
  };
}

export function blankEvent(): EventInitial {
  return {
    slug: "",
    status: "draft",
    title: "",
    summary: "",
    body: [],
    cover: null,
    category: "meeting",
  };
}

export function toEventInitial(doc: any): EventInitial {
  return {
    id: String(doc._id),
    slug: doc.slug ?? "",
    status: doc.status ?? "draft",
    order: doc.order ?? undefined,
    title: doc.title ?? "",
    summary: doc.summary ?? "",
    cover: toImageValue(doc.cover),
    body: toBlockValues(doc.body),
    category: doc.category ?? "meeting",
    startsAt: toDateTimeInput(doc.startsAt),
    endsAt: toDateTimeInput(doc.endsAt),
    venueName: doc.venueName ?? undefined,
    venueAddress: doc.venueAddress ?? undefined,
    lgaSlug: doc.lgaSlug ?? undefined,
    registrationUrl: doc.registrationUrl ?? undefined,
    notice: doc.notice ?? undefined,
  };
}

export function blankPage(): PageInitial {
  return {
    slug: "",
    status: "draft",
    title: "",
    summary: "",
    body: [],
    cover: null,
  };
}

export function toPageInitial(doc: any): PageInitial {
  return {
    id: String(doc._id),
    slug: doc.slug ?? "",
    status: doc.status ?? "draft",
    order: doc.order ?? undefined,
    title: doc.title ?? "",
    summary: doc.description ?? "",
    cover: toImageValue(doc.cover),
    body: toBlockValues(doc.body),
    eyebrow: doc.eyebrow ?? undefined,
    metaTitle: doc.metaTitle ?? undefined,
    metaDescription: doc.metaDescription ?? undefined,
  };
}

/** The local government list, for the event form's location field. */
export function lgaOptions() {
  return lgas.map((entry) => ({ slug: entry.slug, name: entry.name }));
}
