"use server";

import { redirect } from "next/navigation";
import { Achievement, Article, EventModel, GalleryAlbum, Page, Category } from "../models";
import type { AchievementDoc, ArticleDoc, EventDoc, GalleryAlbumDoc } from "../models";
import { guard, statusFor } from "../admin/guard";
import { revalidateFor } from "../admin/revalidate";
import {
  blocks,
  bool,
  csv,
  date,
  fail,
  fromDatabaseError,
  image,
  imageList,
  num,
  reqStr,
  lines,
  slugFrom,
  str,
  writable,
  type ActionState,
} from "../admin/forms";

/**
 * Editorial writes: articles, events, pages and categories.
 *
 * Grouped in one module because they share a shape almost exactly — slug,
 * publication state, cover image, block body — and differ only in a handful of
 * fields each. Four near-identical files would hide that.
 *
 * Every action follows the same order: guard, build, save, revalidate,
 * redirect. `redirect` unwinds the request by throwing, so it is always the
 * final statement and never inside a `try` — a `catch` would swallow it and
 * leave the editor on a form that had already saved.
 */

/* -------------------------------------------------------------------------- */
/*  Articles                                                                   */
/* -------------------------------------------------------------------------- */

function buildArticle(form: FormData, role: string) {
  return {
    slug: slugFrom(form, "slug", "title"),
    status: statusFor(str(form, "status"), role),
    order: num(form, "order"),
    type: (str(form, "type") ?? "news") as ArticleDoc["type"],
    title: reqStr(form, "title"),
    kicker: str(form, "kicker"),
    excerpt: reqStr(form, "excerpt"),
    // An unset select submits ""; passing that as an ObjectId throws a cast
    // error, so absence has to be `undefined`, not an empty string.
    category: str(form, "category"),
    tags: csv(form, "tags"),
    authorName: str(form, "authorName"),
    authorRole: str(form, "authorRole"),
    cover: image(form, "cover"),
    body: blocks(form, "body"),
    featured: bool(form, "featured"),
    publishedAt: date(form, "publishedAt") ?? undefined,
  };
}

export async function createArticle(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const doc = buildArticle(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a headline, or a slug." });

  let slug: string;
  try {
    const created = await Article.create(writable(doc));
    slug = created.slug;
  } catch (error) {
    return fromDatabaseError(error, "create article");
  }

  revalidateFor("articles");
  redirect(`/admin/articles?saved=${encodeURIComponent(slug)}`);
}

export async function updateArticle(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("This record could not be identified. Reload the page and try again.");

  const doc = buildArticle(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a headline, or a slug." });

  try {
    const existing = await Article.findById(id);
    if (!existing) return fail("That article no longer exists. It may have been deleted.");
    Object.assign(existing, writable(doc));
    if (doc.cover === null) existing.set("cover", undefined);
    if (doc.category === undefined) existing.set("category", undefined);
    await existing.save();
  } catch (error) {
    return fromDatabaseError(error, "update article");
  }

  revalidateFor("articles");
  redirect(`/admin/articles?saved=${encodeURIComponent(doc.slug)}`);
}

export async function deleteArticle(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/articles?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }
  const id = str(form, "id");
  if (id) await Article.findByIdAndDelete(id).catch(() => null);
  revalidateFor("articles");
  redirect("/admin/articles?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*  Events                                                                     */
/* -------------------------------------------------------------------------- */

function buildEvent(form: FormData, role: string) {
  return {
    slug: slugFrom(form, "slug", "title"),
    status: statusFor(str(form, "status"), role),
    order: num(form, "order"),
    title: reqStr(form, "title"),
    summary: reqStr(form, "summary"),
    category: (str(form, "category") ?? "meeting") as EventDoc["category"],
    startsAt: date(form, "startsAt"),
    endsAt: date(form, "endsAt"),
    venueName: str(form, "venueName"),
    venueAddress: str(form, "venueAddress"),
    lgaSlug: str(form, "lgaSlug"),
    registrationUrl: str(form, "registrationUrl"),
    notice: str(form, "notice"),
    cover: image(form, "cover"),
    body: blocks(form, "body"),
  };
}

export async function createEvent(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const doc = buildEvent(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });
  if (!doc.startsAt) {
    return fail("A start date and time is required.", { startsAt: "Enter when this starts." });
  }

  let slug: string;
  try {
    const created = await EventModel.create(writable(doc));
    slug = created.slug;
  } catch (error) {
    return fromDatabaseError(error, "create event");
  }

  revalidateFor("events");
  redirect(`/admin/events?saved=${encodeURIComponent(slug)}`);
}

export async function updateEvent(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("This record could not be identified. Reload the page and try again.");

  const doc = buildEvent(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });
  if (!doc.startsAt) {
    return fail("A start date and time is required.", { startsAt: "Enter when this starts." });
  }

  try {
    const existing = await EventModel.findById(id);
    if (!existing) return fail("That event no longer exists. It may have been deleted.");
    Object.assign(existing, writable(doc));
    if (doc.endsAt === null) existing.set("endsAt", undefined);
    if (doc.cover === null) existing.set("cover", undefined);
    await existing.save();
  } catch (error) {
    return fromDatabaseError(error, "update event");
  }

  revalidateFor("events");
  redirect(`/admin/events?saved=${encodeURIComponent(doc.slug)}`);
}

export async function deleteEvent(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/events?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }
  const id = str(form, "id");
  if (id) await EventModel.findByIdAndDelete(id).catch(() => null);
  revalidateFor("events");
  redirect("/admin/events?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*  Pages                                                                      */
/* -------------------------------------------------------------------------- */

function buildPage(form: FormData, role: string) {
  return {
    slug: slugFrom(form, "slug", "title"),
    status: statusFor(str(form, "status"), role),
    order: num(form, "order"),
    title: reqStr(form, "title"),
    eyebrow: str(form, "eyebrow"),
    description: str(form, "description"),
    cover: image(form, "cover"),
    body: blocks(form, "body"),
    metaTitle: str(form, "metaTitle"),
    metaDescription: str(form, "metaDescription"),
  };
}

export async function createPage(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const doc = buildPage(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });

  let slug: string;
  try {
    const created = await Page.create(writable(doc));
    slug = created.slug;
  } catch (error) {
    return fromDatabaseError(error, "create page");
  }

  revalidateFor("pages");
  redirect(`/admin/pages?saved=${encodeURIComponent(slug)}`);
}

export async function updatePage(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("This record could not be identified. Reload the page and try again.");

  const doc = buildPage(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });

  try {
    const existing = await Page.findById(id);
    if (!existing) return fail("That page no longer exists. It may have been deleted.");
    Object.assign(existing, writable(doc));
    if (doc.cover === null) existing.set("cover", undefined);
    await existing.save();
  } catch (error) {
    return fromDatabaseError(error, "update page");
  }

  revalidateFor("pages");
  redirect(`/admin/pages?saved=${encodeURIComponent(doc.slug)}`);
}

export async function deletePage(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/pages?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }
  const id = str(form, "id");
  if (id) await Page.findByIdAndDelete(id).catch(() => null);
  revalidateFor("pages");
  redirect("/admin/pages?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

export async function saveCategory(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  const doc = {
    slug: slugFrom(form, "slug", "name"),
    name: reqStr(form, "name"),
    description: str(form, "description"),
    order: num(form, "order"),
  };
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a name, or a slug." });

  try {
    if (id) {
      const existing = await Category.findById(id);
      if (!existing) return fail("That category no longer exists.");
      Object.assign(existing, writable(doc));
      await existing.save();
    } else {
      await Category.create(writable(doc));
    }
  } catch (error) {
    return fromDatabaseError(error, "save category");
  }

  revalidateFor("categories");
  redirect("/admin/categories?saved=1");
}

/**
 * Removing a category leaves the articles that referenced it intact.
 *
 * `category` is an optional reference, so those articles simply become
 * uncategorised — which is recoverable. Cascading the delete to the articles
 * would destroy editorial work to tidy up a taxonomy label.
 */
export async function deleteCategory(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/categories?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }
  const id = str(form, "id");
  if (id) {
    await Article.updateMany({ category: id }, { $unset: { category: "" } }).catch(() => null);
    await Category.findByIdAndDelete(id).catch(() => null);
  }
  revalidateFor("categories");
  revalidateFor("articles");
  redirect("/admin/categories?deleted=1");
}

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Achievements                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Metrics arrive as two parallel textareas — labels and values, one per line —
 * because a repeatable pair of inputs is slower to fill and impossible to
 * paste into. Rows are matched by position and any row missing either half is
 * dropped rather than stored half-empty.
 */
function buildMetrics(form: FormData): { label: string; value: string }[] {
  const labels = lines(form, "metricLabels");
  const values = lines(form, "metricValues");
  const rows: { label: string; value: string }[] = [];

  for (let index = 0; index < Math.max(labels.length, values.length); index += 1) {
    const label = labels[index];
    const value = values[index];
    if (label && value) rows.push({ label, value });
  }
  return rows;
}

function buildAchievement(form: FormData, role: string) {
  return {
    slug: slugFrom(form, "slug", "title"),
    status: statusFor(str(form, "status"), role),
    order: num(form, "order"),
    title: reqStr(form, "title"),
    summary: reqStr(form, "summary"),
    description: blocks(form, "description"),
    category: (str(form, "category") ?? "infrastructure") as AchievementDoc["category"],
    year: num(form, "year"),
    location: str(form, "location"),
    lgaSlug: str(form, "lgaSlug"),
    personSlug: str(form, "personSlug"),
    metrics: buildMetrics(form),
    cover: image(form, "cover"),
    source: str(form, "source"),
  };
}

export async function createAchievement(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const doc = buildAchievement(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });

  let slug: string;
  try {
    const created = await Achievement.create(writable(doc));
    slug = created.slug;
  } catch (error) {
    return fromDatabaseError(error, "create achievement");
  }

  revalidateFor("achievements");
  redirect(`/admin/achievements?saved=${encodeURIComponent(slug)}`);
}

export async function updateAchievement(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("This record could not be identified. Reload the page and try again.");

  const doc = buildAchievement(form, auth.session.role);
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });

  try {
    const existing = await Achievement.findById(id);
    if (!existing) return fail("That achievement no longer exists. It may have been deleted.");
    Object.assign(existing, writable(doc));
    if (doc.cover === null) existing.set("cover", undefined);
    // An emptied optional field must be unset, not left at its previous value.
    for (const field of ["year", "location", "lgaSlug", "personSlug", "source"] as const) {
      if (doc[field] === undefined) existing.set(field, undefined);
    }
    await existing.save();
  } catch (error) {
    return fromDatabaseError(error, "update achievement");
  }

  revalidateFor("achievements");
  redirect(`/admin/achievements?saved=${encodeURIComponent(doc.slug)}`);
}

export async function deleteAchievement(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/achievements?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }
  const id = str(form, "id");
  if (id) await Achievement.findByIdAndDelete(id).catch(() => null);
  revalidateFor("achievements");
  redirect("/admin/achievements?deleted=1");
}

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                    */
/* -------------------------------------------------------------------------- */

function buildAlbum(form: FormData, role: string) {
  const photos = imageList(form, "images");
  return {
    photos,
    doc: {
      slug: slugFrom(form, "slug", "title"),
      status: statusFor(str(form, "status"), role),
      order: num(form, "order"),
      title: reqStr(form, "title"),
      description: str(form, "description"),
      category: (str(form, "category") ?? "events") as GalleryAlbumDoc["category"],
      date: date(form, "date"),
      location: str(form, "location"),
      cover: image(form, "cover"),
      images: photos.images,
      relatedEventSlug: str(form, "relatedEventSlug"),
    },
  };
}

/**
 * Refuses a save that would lose a photograph.
 *
 * `imageList` counts entries it could not accept instead of discarding them,
 * so the editor is told which problem to fix and nothing they uploaded
 * disappears between the form and the database.
 */
function photoProblem(photos: ReturnType<typeof imageList>): ActionState | null {
  if (photos.missingAlt > 0) {
    return fail(
      `${photos.missingAlt} photograph${photos.missingAlt === 1 ? " needs" : "s need"} a description ` +
        "before this album can be saved. Each one is marked in the list.",
      { images: "Describe every photograph for readers using a screen reader." },
    );
  }
  if (photos.malformed > 0) {
    return fail(
      "Some photographs could not be read. Remove them and upload them again.",
      { images: "One or more uploads were incomplete." },
    );
  }
  return null;
}

export async function createAlbum(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const { photos, doc } = buildAlbum(form, auth.session.role);
  const problem = photoProblem(photos);
  if (problem) return problem;
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });

  let slug: string;
  try {
    const created = await GalleryAlbum.create(writable(doc));
    slug = created.slug;
  } catch (error) {
    return fromDatabaseError(error, "create album");
  }

  revalidateFor("gallery");
  redirect(`/admin/gallery?saved=${encodeURIComponent(slug)}`);
}

export async function updateAlbum(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("This album could not be identified. Reload the page and try again.");

  const { photos, doc } = buildAlbum(form, auth.session.role);
  const problem = photoProblem(photos);
  if (problem) return problem;
  if (!doc.slug) return fail("A URL slug is required.", { slug: "Enter a title, or a slug." });

  try {
    const existing = await GalleryAlbum.findById(id);
    if (!existing) return fail("That album no longer exists. It may have been deleted.");
    Object.assign(existing, writable(doc));
    // `writable` drops empties; an emptied field must be unset explicitly or it
    // keeps its old value. `images` is always assigned, so removing every
    // photograph does clear the list.
    existing.set("images", doc.images);
    if (doc.cover === null) existing.set("cover", undefined);
    if (doc.date === null) existing.set("date", undefined);
    for (const field of ["description", "location", "relatedEventSlug"] as const) {
      if (doc[field] === undefined) existing.set(field, undefined);
    }
    await existing.save();
  } catch (error) {
    return fromDatabaseError(error, "update album");
  }

  revalidateFor("gallery");
  redirect(`/admin/gallery?saved=${encodeURIComponent(doc.slug)}`);
}

/**
 * Deletes the album record. The photographs stay in Cloudinary and in the
 * media library: they may be reused elsewhere, and destroying an image still
 * referenced by an article would break a live page.
 */
export async function deleteAlbum(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/gallery?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }
  const id = str(form, "id");
  if (id) await GalleryAlbum.findByIdAndDelete(id).catch(() => null);
  revalidateFor("gallery");
  redirect("/admin/gallery?deleted=1");
}
