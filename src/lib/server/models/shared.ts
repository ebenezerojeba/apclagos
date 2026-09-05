/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { Schema, type Model } from "mongoose";
import mongoose from "mongoose";

/**
 * Pieces every model shares.
 *
 * Every schema is declared `new Schema<any>(…)` and the document type is
 * applied at `defineModel<T>()`. Mongoose 9 infers a document type from the
 * definition object, and that inference rejects two things this file depends
 * on: spreading a shared block of common fields, and `readonly` enum tuples
 * from `as const`. Typing at the model keeps queries and documents fully typed
 * — `Article.find()` still returns `ArticleDoc[]` — while letting the schema
 * definitions stay readable.
 *
 * Two things are deliberately uniform across every collection:
 *
 *  - **Publication state.** `status` plus `publishedAt` rather than a boolean,
 *    so a record can be drafted, scheduled, published and then retired without
 *    being deleted. The public site only ever reads `status: "published"`.
 *  - **Images as references, never binaries.** An image field stores what
 *    Cloudinary returned; the bytes stay in Cloudinary. Storing binaries in
 *    MongoDB would blow past the 16 MB document limit and make every read
 *    drag megabytes across the wire.
 */

/**
 * Registers a model once, tolerating hot reload and warm container reuse.
 *
 * Schemas are declared untyped and the document type is applied here. Mongoose
 * 9's `Schema<T>` generic infers a `SchemaDefinition` so strict that ordinary
 * declarations (`required: [true, "message"]`, a shared spread of common
 * fields, a `readonly` enum tuple) fail to assign. Typing at the model instead
 * gives fully typed queries and documents without fighting that inference.
 */
export function defineModel<T>(name: string, schema: Schema<any>): Model<T> {
  return (
    (mongoose.models[name] as Model<T>) ??
    mongoose.model<T>(name, schema as Schema<T>)
  );
}

export const PUBLISH_STATUSES = ["draft", "published", "archived"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/*  Cloudinary image reference                                                 */
/* -------------------------------------------------------------------------- */

export interface CloudinaryImage {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  /** Required in practice — the UI refuses to save an image without it. */
  alt: string;
  caption?: string;
  credit?: string;
  /** Which part of the frame must survive a crop. */
  focal?: "top" | "center" | "bottom" | "left" | "right";
}

export const imageSchema = new Schema<any>(
  {
    url: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true, index: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    format: { type: String, required: true, trim: true },
    alt: {
      type: String,
      required: [true, "Alternative text is required for every image."],
      trim: true,
      maxlength: 300,
    },
    caption: { type: String, trim: true, maxlength: 500 },
    credit: { type: String, trim: true, maxlength: 200 },
    focal: {
      type: String,
      enum: ["top", "center", "bottom", "left", "right"],
      default: "center",
    },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/*  Rich body                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A closed block model, mirroring `ArticleBlock` in `src/types/content.ts`.
 *
 * Closed on purpose: only these node types can ever be stored, so no raw HTML
 * from an editor reaches the page and the whole stored-XSS class disappears.
 */
export const BLOCK_TYPES = [
  "paragraph",
  "heading",
  "list",
  "quote",
  "image",
  "video",
] as const;

export interface ContentBlock {
  type: (typeof BLOCK_TYPES)[number];
  text?: string;
  level?: 2 | 3;
  ordered?: boolean;
  items?: string[];
  attribution?: string;
  image?: CloudinaryImage;
  videoProvider?: "youtube" | "vimeo" | "file";
  videoRef?: string;
  title?: string;
}

export const blockSchema = new Schema<any>(
  {
    type: { type: String, enum: [...BLOCK_TYPES], required: true },
    text: { type: String, trim: true },
    level: { type: Number, enum: [2, 3] },
    ordered: { type: Boolean },
    items: [{ type: String, trim: true }],
    attribution: { type: String, trim: true },
    image: { type: imageSchema },
    videoProvider: { type: String, enum: ["youtube", "vimeo", "file"] },
    videoRef: { type: String, trim: true },
    title: { type: String, trim: true },
  },
  { _id: false },
);

/* -------------------------------------------------------------------------- */
/*  Slugs                                                                      */
/* -------------------------------------------------------------------------- */

/** Mirrors `slugify` in `src/lib/slug.ts` so URLs match wherever they are made. */
export function toSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[‘’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fields shared by every publishable record.
 *
 * Deliberately NOT `as const`: Mongoose's `SchemaDefinition` expects mutable
 * tuples for `required: [true, "message"]` and `match: [regex, "message"]`, and
 * a readonly literal fails to assign.
 */
export const publishableFields = {
  slug: {
    type: String,
    required: [true, "A slug is required."],
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, "Slugs may contain lowercase letters, numbers and hyphens only."],
  },
  status: {
    type: String,
    enum: [...PUBLISH_STATUSES],
    default: "draft" as PublishStatus,
    index: true,
  },
  /** Set the moment a record first becomes published; used for ordering. */
  publishedAt: { type: Date },
  /** Manual sort weight. Lower sorts first; ties fall back to name or date. */
  order: { type: Number },
};

/**
 * Registers a `pre` hook.
 *
 * `Schema<any>` leaves Mongoose's heavily overloaded `pre` signature
 * unresolvable to TypeScript, so it is narrowed to the one shape used here.
 */
type PreHookFn = (this: unknown, next: (err?: Error) => void) => void;

export function addPreHook(
  schema: Schema<any>,
  event: "save" | "validate",
  fn: PreHookFn,
): void {
  (schema as unknown as {
    pre: (event: string, fn: PreHookFn) => void;
  }).pre(event, fn);
}

/**
 * Keeps `publishedAt` honest.
 *
 * Without this an editor could publish, unpublish and republish a record and
 * have it jump to the top of the newsroom each time, or publish a record that
 * never gets a date at all and sorts as epoch zero.
 */
export function attachPublishHook(schema: Schema<any>) {
  addPreHook(schema, "save", function (next) {
    const doc = this as { status?: string; publishedAt?: Date };
    if (doc.status === "published" && !doc.publishedAt) {
      doc.publishedAt = new Date();
    }
    next();
  });
}
