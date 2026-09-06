import "server-only";

import { z } from "zod";
import type { CloudinaryImage, ContentBlock } from "../models";

/**
 * Turning a submitted `FormData` into a validated document.
 *
 * Every admin screen is a plain `<form>` posting to a server action, so what
 * arrives is always `FormData`: strings, or nothing. These helpers do the
 * narrowing in one place rather than in seven collections' worth of actions.
 *
 * Two conventions run through the whole admin:
 *
 *  - **Lists are text.** A biography, a list of committees, a set of address
 *    lines — all are edited as a textarea, one entry per line (or one per
 *    blank-line-separated block for prose). Repeatable input rows look more
 *    "designed" but are slower to fill in, harder to reorder and harder to
 *    paste into, and an editor entering forty councillors will do it by paste.
 *  - **Structured values travel as JSON in a hidden field.** Images and rich
 *    bodies are built by a client component and serialised into one input.
 *    They are then re-validated here with Zod, because a hidden field is just
 *    as forgeable as a visible one.
 */

/* -------------------------------------------------------------------------- */
/*  Action results                                                             */
/* -------------------------------------------------------------------------- */

export interface ActionState {
  ok: boolean;
  /** Shown as a banner above the form. */
  error?: string;
  /** Shown beneath the matching control. Keys are field names. */
  fieldErrors?: Record<string, string>;
  /** Set after a successful save, for a transient confirmation. */
  message?: string;
}

export const IDLE: ActionState = { ok: false };

export function fail(error: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, error, fieldErrors };
}

/* -------------------------------------------------------------------------- */
/*  Scalars                                                                    */
/* -------------------------------------------------------------------------- */

/** A trimmed string, or `undefined` when the field is absent or empty. */
export function str(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** A trimmed string, or `""`. Use where the model wants a value, not a gap. */
export function reqStr(form: FormData, name: string): string {
  return str(form, name) ?? "";
}

export function num(form: FormData, name: string): number | undefined {
  const raw = str(form, name);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * An unchecked checkbox submits nothing at all, so absence means false. Every
 * boolean field is paired with a hidden `0` input in the markup, which makes
 * "unchecked" explicit and survives a browser that omits the checkbox entirely.
 */
export function bool(form: FormData, name: string): boolean {
  const values = form.getAll(name).map(String);
  return values.includes("on") || values.includes("true") || values.includes("1");
}

/**
 * A `datetime-local` or `date` value.
 *
 * Returns `null` rather than `undefined` for a cleared field: `undefined` is
 * dropped by Mongoose's update, leaving the old value in place, whereas `null`
 * unsets it. That difference is the whole reason an editor can clear a date.
 */
export function date(form: FormData, name: string): Date | null | undefined {
  const raw = str(form, name);
  if (raw === undefined) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/* -------------------------------------------------------------------------- */
/*  Lists                                                                      */
/* -------------------------------------------------------------------------- */

/** One entry per line. Blank lines are dropped. */
export function lines(form: FormData, name: string): string[] {
  const raw = form.get(name);
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * One entry per blank-line-separated block, for prose.
 *
 * A biography is paragraphs, and a paragraph often wraps across several lines
 * in the textarea. Splitting on single newlines would shred it; splitting on
 * blank lines matches how people actually type prose.
 */
export function paragraphs(form: FormData, name: string): string[] {
  const raw = form.get(name);
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim().replace(/\s*\r?\n\s*/g, " "))
    .filter(Boolean);
}

/** Comma-separated, for tags. */
export function csv(form: FormData, name: string): string[] {
  const raw = str(form, name);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((entry) => entry.trim()).filter(Boolean))];
}

/* -------------------------------------------------------------------------- */
/*  Structured values                                                          */
/* -------------------------------------------------------------------------- */

const imageSchema = z.object({
  url: z.string().min(1),
  secureUrl: z.string().min(1),
  publicId: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().min(1),
  alt: z.string().trim().min(1).max(300),
  caption: z.string().trim().max(500).optional(),
  credit: z.string().trim().max(200).optional(),
  focal: z.enum(["top", "center", "bottom", "left", "right"]).optional(),
});

/**
 * Reads an image written by `ImageField`.
 *
 * `null` means the editor removed the image and the field must be unset;
 * `undefined` means the field was not part of this form at all.
 */
export function image(
  form: FormData,
  name: string,
): CloudinaryImage | null | undefined {
  const raw = form.get(name);
  if (typeof raw !== "string") return undefined;
  if (raw.trim() === "" || raw.trim() === "null") return null;

  const parsed = imageSchema.safeParse(safeJson(raw));
  if (!parsed.success) return undefined;
  return parsed.data as CloudinaryImage;
}

const blockSchema = z
  .object({
    type: z.enum(["paragraph", "heading", "list", "quote", "image", "video"]),
    text: z.string().optional(),
    level: z.union([z.literal(2), z.literal(3)]).optional(),
    ordered: z.boolean().optional(),
    items: z.array(z.string()).optional(),
    attribution: z.string().optional(),
    image: imageSchema.optional(),
    videoProvider: z.enum(["youtube", "vimeo", "file"]).optional(),
    videoRef: z.string().optional(),
    title: z.string().optional(),
  })
  // A block whose own payload is empty renders as a gap on the public page.
  .refine(
    (block) =>
      (block.type === "image" && block.image) ||
      (block.type === "video" && block.videoRef) ||
      (block.type === "list" && (block.items?.length ?? 0) > 0) ||
      Boolean(block.text?.trim()),
    { message: "Every block needs content." },
  );

/**
 * Reads a rich body written by `BlockEditor`.
 *
 * Each block is validated on its own and invalid ones are dropped. Validating
 * the array as a whole - `z.array(blockSchema).safeParse(...)` - looks
 * equivalent but is not: a single empty block would fail the array parse and
 * silently discard the entire body, so an editor who left one stray paragraph
 * open would save an article with no content and no error to explain it.
 *
 * Dropping rather than rejecting is deliberate. An empty block is a half-typed
 * thought, not a mistake worth blocking a save over, and the editor can see
 * immediately that it did not survive.
 */
export function blocks(form: FormData, name: string): ContentBlock[] {
  const raw = form.get(name);
  if (typeof raw !== "string" || raw.trim() === "") return [];

  const candidates = safeJson(raw);
  if (!Array.isArray(candidates)) return [];

  const kept: ContentBlock[] = [];
  for (const candidate of candidates) {
    const parsed = blockSchema.safeParse(candidate);
    if (parsed.success) kept.push(parsed.data as ContentBlock);
  }
  return kept;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Slugs                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Takes the submitted slug, or derives one from a title.
 *
 * Deriving only when the field is blank is deliberate: once a record is
 * published its slug is a URL somebody may have linked to, so renaming the
 * title must never silently move the page.
 */
export function slugFrom(form: FormData, slugField: string, fallbackField: string): string {
  const explicit = str(form, slugField);
  const source = explicit ?? str(form, fallbackField) ?? "";
  return source
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* -------------------------------------------------------------------------- */
/*  Handing a built object to a model                                          */
/* -------------------------------------------------------------------------- */

/**
 * The same object with every key optional and no `null` or `undefined` left in
 * any value's type.
 *
 * This is what `writable` returns, and it is the type Mongoose's `create` and
 * `Object.assign` actually accept. Deleting a key at runtime does not narrow
 * anything on its own - TypeScript still believes `portrait` may be `null` -
 * so the guarantee has to be stated here for the compiler to see it.
 */
export type Writable<T> = { [K in keyof T]?: Exclude<T[K], null | undefined> };

/**
 * Prepares a form-built object for a model write.
 *
 * Removes three things, each for a different reason:
 *
 *  - `undefined` - the field was not part of this form at all.
 *  - `null` - the editor cleared the field. Mongoose ignores `undefined` in an
 *    assignment and would leave the previous value in place, so clearing is
 *    expressed by an explicit `.set(field, undefined)` in the update path
 *    instead. Passing the `null` through would either be ignored or stored.
 *  - empty strings on the keys named in `dropWhenEmpty` - an unselected
 *    `<select>` submits `""`, which Mongoose validates against the enum and
 *    rejects. An editor would see a validation error on a field they never
 *    touched; deleting the key leaves it genuinely unset.
 */
export function writable<T extends Record<string, unknown>>(
  doc: T,
  dropWhenEmpty: readonly string[] = [],
): Writable<T> {
  const output: Record<string, unknown> = { ...doc };

  for (const key of dropWhenEmpty) {
    if (!output[key]) delete output[key];
  }
  for (const key of Object.keys(output)) {
    if (output[key] === undefined || output[key] === null) delete output[key];
  }

  return output as Writable<T>;
}

/* -------------------------------------------------------------------------- */
/*  Database errors                                                            */
/* -------------------------------------------------------------------------- */

interface MongooseValidationError {
  name: string;
  errors: Record<string, { message?: string; path?: string }>;
}

interface MongoDuplicateKeyError {
  code: number;
  keyPattern?: Record<string, unknown>;
}

function isValidationError(error: unknown): error is MongooseValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "ValidationError" &&
    typeof (error as { errors?: unknown }).errors === "object"
  );
}

function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

/**
 * Turns a database rejection into something an editor can act on.
 *
 * Schema validators already carry good messages ("A headline is required."),
 * so those are surfaced verbatim against the field that produced them. Anything
 * unrecognised becomes a generic message and is logged by name only — a driver
 * message can embed the cluster host, and that must not reach a browser.
 */
export function fromDatabaseError(error: unknown, context: string): ActionState {
  if (isValidationError(error)) {
    const fieldErrors: Record<string, string> = {};
    for (const [path, detail] of Object.entries(error.errors)) {
      fieldErrors[path] ??= detail?.message ?? "This value is not valid.";
    }
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {}).find((key) => key !== "kind");
    return {
      ok: false,
      error:
        field === "slug"
          ? "That URL slug is already in use. Choose a different one."
          : "A record with those details already exists.",
      fieldErrors: field ? { [field]: "Already in use." } : undefined,
    };
  }

  const name = error instanceof Error ? error.name : "UnknownError";
  console.error(`[admin] ${context} failed: ${name}`);
  return {
    ok: false,
    error: "Could not save. The database rejected the change — please try again.",
  };
}
