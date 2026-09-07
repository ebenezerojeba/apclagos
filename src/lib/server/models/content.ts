/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { Schema, type Types } from "mongoose";
import {
  addPreHook,
  attachPublishHook,
  blockSchema,
  defineModel,
  imageSchema,
  publishableFields,
  type CloudinaryImage,
  type ContentBlock,
  type PublishStatus,
} from "./shared";

/**
 * Editorial content: articles, events, pages and the categories that group
 * them.
 *
 * News, articles, announcements and press releases are **one** model separated
 * by `type`, not four near-identical collections. They share every field that
 * matters — slug, cover, body, publication state — and splitting them would
 * mean four sets of queries, four admin screens and four places to fix a bug,
 * for no gain. The public newsroom filters on `type` and `category`.
 */

/* -------------------------------------------------------------------------- */
/*  Category                                                                   */
/* -------------------------------------------------------------------------- */

export interface CategoryDoc {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<any>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Slugs may contain lowercase letters, numbers and hyphens only."],
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 400 },
    order: { type: Number },
  },
  { timestamps: true },
);

export const Category = defineModel<CategoryDoc>("Category", categorySchema);

/* -------------------------------------------------------------------------- */
/*  Article — news, announcements and press releases                           */
/* -------------------------------------------------------------------------- */

export const ARTICLE_TYPES = ["news", "announcement", "press-release"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export interface ArticleDoc {
  _id: Types.ObjectId;
  slug: string;
  status: PublishStatus;
  publishedAt?: Date;
  order?: number;
  type: ArticleType;
  title: string;
  kicker?: string;
  excerpt: string;
  category?: Types.ObjectId;
  tags: string[];
  authorName?: string;
  authorRole?: string;
  cover?: CloudinaryImage;
  body: ContentBlock[];
  featured: boolean;
  popularity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<any>(
  {
    ...publishableFields,
    type: { type: String, enum: [...ARTICLE_TYPES], default: "news", index: true },
    title: { type: String, required: [true, "A headline is required."], trim: true, maxlength: 220 },
    kicker: { type: String, trim: true, maxlength: 120 },
    excerpt: {
      type: String,
      required: [true, "A short summary is required — it is used on cards and as the meta description."],
      trim: true,
      maxlength: 400,
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    authorName: { type: String, trim: true, maxlength: 120 },
    authorRole: { type: String, trim: true, maxlength: 120 },
    cover: { type: imageSchema },
    body: { type: [blockSchema], default: [] },
    featured: { type: Boolean, default: false },
    popularity: { type: Number },
  },
  { timestamps: true },
);

// One slug per article; the compound index also serves the newsroom's main
// query (published, newest first) without a second scan.
articleSchema.index({ slug: 1 }, { unique: true });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, type: 1, publishedAt: -1 });
articleSchema.index({ title: "text", excerpt: "text" });
attachPublishHook(articleSchema);

export const Article = defineModel<ArticleDoc>("Article", articleSchema);

/* -------------------------------------------------------------------------- */
/*  Event                                                                      */
/* -------------------------------------------------------------------------- */

export const EVENT_CATEGORIES = [
  "congress",
  "rally",
  "meeting",
  "town-hall",
  "commissioning",
  "training",
  "community",
  "other",
] as const;

export interface EventDoc {
  _id: Types.ObjectId;
  slug: string;
  status: PublishStatus;
  publishedAt?: Date;
  order?: number;
  title: string;
  summary: string;
  category: (typeof EVENT_CATEGORIES)[number];
  startsAt: Date;
  endsAt?: Date;
  venueName?: string;
  venueAddress?: string;
  lgaSlug?: string;
  registrationUrl?: string;
  notice?: string;
  cover?: CloudinaryImage;
  body: ContentBlock[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<any>(
  {
    ...publishableFields,
    title: { type: String, required: [true, "An event title is required."], trim: true, maxlength: 220 },
    summary: { type: String, required: [true, "A one-line summary is required."], trim: true, maxlength: 400 },
    category: { type: String, enum: [...EVENT_CATEGORIES], default: "meeting", index: true },
    startsAt: { type: Date, required: [true, "A start date and time is required."], index: true },
    endsAt: { type: Date },
    venueName: { type: String, trim: true, maxlength: 200 },
    venueAddress: { type: String, trim: true, maxlength: 300 },
    lgaSlug: { type: String, trim: true, lowercase: true },
    registrationUrl: { type: String, trim: true, maxlength: 500 },
    notice: { type: String, trim: true, maxlength: 160 },
    cover: { type: imageSchema },
    body: { type: [blockSchema], default: [] },
  },
  { timestamps: true },
);

eventSchema.index({ slug: 1 }, { unique: true });
// The calendar's two queries: upcoming ascending, past descending.
eventSchema.index({ status: 1, startsAt: 1 });
attachPublishHook(eventSchema);

// An event that ends before it starts is a data-entry error, not a valid state.
addPreHook(eventSchema, "validate", function () {
  const doc = this as EventDoc & {
    invalidate: (path: string, message: string) => void;
  };
  if (doc.endsAt && doc.startsAt && doc.endsAt < doc.startsAt) {
    doc.invalidate("endsAt", "The end time cannot be before the start time.");
  }
});

export const EventModel = defineModel<EventDoc>("Event", eventSchema);

/* -------------------------------------------------------------------------- */
/*  Page — free-form institutional pages                                       */
/* -------------------------------------------------------------------------- */

export interface PageDoc {
  _id: Types.ObjectId;
  slug: string;
  status: PublishStatus;
  publishedAt?: Date;
  order?: number;
  title: string;
  eyebrow?: string;
  description?: string;
  cover?: CloudinaryImage;
  body: ContentBlock[];
  /** Overrides the generated <title>; falls back to `title`. */
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<any>(
  {
    ...publishableFields,
    title: { type: String, required: [true, "A page title is required."], trim: true, maxlength: 220 },
    eyebrow: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 400 },
    cover: { type: imageSchema },
    body: { type: [blockSchema], default: [] },
    metaTitle: { type: String, trim: true, maxlength: 200 },
    metaDescription: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

pageSchema.index({ slug: 1 }, { unique: true });
attachPublishHook(pageSchema);

export const Page = defineModel<PageDoc>("Page", pageSchema);

/* -------------------------------------------------------------------------- */
/*  Achievement                                                                */
/* -------------------------------------------------------------------------- */

export const ACHIEVEMENT_CATEGORIES = [
  "infrastructure",
  "education",
  "health",
  "security",
  "economy",
  "transport",
  "environment",
  "social",
  "party-organisation",
] as const;

/**
 * A delivered project, programme or milestone.
 *
 * `source` is what keeps this collection honest: every entry names the
 * ministry, agency or council that published the claim, so nothing here is an
 * unattributed assertion.
 *
 * `personSlug` credits an individual where one is being credited - the
 * President, the governorship candidate, a council chairman. It is a plain slug
 * rather than an enum on purpose: adding another leader is a new record, not a
 * schema migration, which is what "keep it flexible" has to mean if it is to
 * mean anything.
 */
export interface AchievementDoc {
  _id: Types.ObjectId;
  slug: string;
  status: PublishStatus;
  publishedAt?: Date;
  order?: number;
  title: string;
  summary: string;
  description: ContentBlock[];
  category: (typeof ACHIEVEMENT_CATEGORIES)[number];
  year?: number;
  location?: string;
  lgaSlug?: string;
  personSlug?: string;
  metrics: { label: string; value: string }[];
  cover?: CloudinaryImage;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const metricSchema = new Schema<any>(
  {
    label: { type: String, required: true, trim: true, maxlength: 120 },
    value: { type: String, required: true, trim: true, maxlength: 60 },
  },
  { _id: false },
);

const achievementSchema = new Schema<any>(
  {
    ...publishableFields,
    title: { type: String, required: [true, "A title is required."], trim: true, maxlength: 220 },
    summary: {
      type: String,
      required: [true, "A one-sentence summary is required - it is what the card shows."],
      trim: true,
      maxlength: 400,
    },
    description: { type: [blockSchema], default: [] },
    category: {
      type: String,
      enum: [...ACHIEVEMENT_CATEGORIES],
      default: "infrastructure",
      index: true,
    },
    year: { type: Number, min: 1960, max: 2100 },
    location: { type: String, trim: true, maxlength: 200 },
    lgaSlug: { type: String, trim: true, lowercase: true, index: true },
    personSlug: { type: String, trim: true, lowercase: true, index: true },
    metrics: { type: [metricSchema], default: [] },
    cover: { type: imageSchema },
    source: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

achievementSchema.index({ slug: 1 }, { unique: true });
achievementSchema.index({ status: 1, year: -1 });
achievementSchema.index({ status: 1, category: 1, year: -1 });
achievementSchema.index({ title: "text", summary: "text" });
attachPublishHook(achievementSchema);

export const Achievement = defineModel<AchievementDoc>("Achievement", achievementSchema);
