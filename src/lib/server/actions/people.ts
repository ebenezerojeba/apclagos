"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Person, PERSON_KINDS, type PersonDoc, type PersonKind } from "../models";
import { guard, statusFor } from "../admin/guard";
import { revalidateFor } from "../admin/revalidate";
import {
  bool,
  csv,
  date,
  fail,
  fromDatabaseError,
  image,
  lines,
  num,
  paragraphs,
  reqStr,
  slugFrom,
  str,
  writable,
  type ActionState,
} from "../admin/forms";

/**
 * Create, update and delete for everyone the party publishes.
 *
 * One action set covers all seven kinds. The differences between a senator and
 * a council chairman are which constituency reference is required and which
 * optional fields are shown — both of which the model already enforces, so
 * duplicating this file per kind would buy nothing but seven places to fix the
 * same bug.
 *
 * The shape of every action is the same and worth stating once:
 *
 *   guard → build → save → revalidate → redirect
 *
 * `redirect` throws internally to unwind the request, so it is always the last
 * statement and never sits inside a `try`. A `catch` around it would swallow
 * the redirect and leave the editor staring at a form that had, in fact, saved.
 */

const kindSchema = z.enum(PERSON_KINDS as unknown as [PersonKind, ...PersonKind[]]);

/**
 * Fields an editor may set, gathered in one place.
 *
 * Read straight from `FormData` rather than through a Zod object because the
 * Mongoose schema is already the authority on lengths, enums and requiredness,
 * and its messages are the ones an editor sees. A second parallel set of rules
 * here would drift out of step with it.
 */
function buildPerson(form: FormData, role: string) {
  const kind = kindSchema.safeParse(str(form, "kind"));
  if (!kind.success) return null;

  return {
    kind: kind.data,
    slug: slugFrom(form, "slug", "name"),
    status: statusFor(str(form, "status"), role),
    order: num(form, "order"),

    name: reqStr(form, "name"),
    honorific: str(form, "honorific"),
    postNominals: str(form, "postNominals"),
    position: reqStr(form, "position"),
    shortPosition: str(form, "shortPosition"),
    summary: str(form, "summary"),
    biography: paragraphs(form, "biography"),
    portrait: image(form, "portrait"),
    jurisdiction: str(form, "jurisdiction"),

    senatorialDistrictSlug: str(form, "senatorialDistrictSlug"),
    federalConstituencySlug: str(form, "federalConstituencySlug"),
    stateConstituencySlug: str(form, "stateConstituencySlug"),
    lgaSlug: str(form, "lgaSlug"),
    lcdaSlug: str(form, "lcdaSlug"),

    body: str(form, "body") as PersonDoc["body"],
    featured: bool(form, "featured"),

    councilSlug: str(form, "councilSlug"),
    councilType: str(form, "councilType") as PersonDoc["councilType"],
    councilRole: str(form, "councilRole") as PersonDoc["councilRole"],

    electionSlug: str(form, "electionSlug"),
    office: str(form, "office") as PersonDoc["office"],
    contestedSeat: str(form, "contestedSeat"),
    runningMateSlug: str(form, "runningMateSlug"),
    manifesto: paragraphs(form, "manifesto"),

    tenureStart: date(form, "tenureStart"),
    tenureEnd: date(form, "tenureEnd"),
    education: lines(form, "education"),
    careerHighlights: lines(form, "careerHighlights"),
    previousPositions: lines(form, "previousPositions"),
    committees: lines(form, "committees"),
    tags: csv(form, "tags"),

    social: {
      facebook: str(form, "social.facebook"),
      x: str(form, "social.x"),
      instagram: str(form, "social.instagram"),
      linkedin: str(form, "social.linkedin"),
      youtube: str(form, "social.youtube"),
      website: str(form, "social.website"),
    },
    email: str(form, "email"),
    phone: str(form, "phone"),
  };
}

/**
 * Optional enums that arrive as `""` when their `<select>` is left unselected.
 */
const OPTIONAL_ENUMS = ["body", "councilType", "councilRole", "office"] as const;

export async function createPerson(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const doc = buildPerson(form, auth.session.role);
  if (!doc) return fail("Choose which kind of record this is.", { kind: "Required." });
  if (!doc.slug) {
    return fail("A URL slug is required.", { slug: "Enter a name, or a slug." });
  }

  let slug: string;
  let kind: PersonKind;
  try {
    const created = await Person.create(writable(doc, OPTIONAL_ENUMS));
    slug = created.slug;
    kind = created.kind;
  } catch (error) {
    return fromDatabaseError(error, "create person");
  }

  revalidateFor("people");
  redirect(`/admin/people?kind=${kind}&saved=${encodeURIComponent(slug)}`);
}

export async function updatePerson(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("This record could not be identified. Reload the page and try again.");

  const doc = buildPerson(form, auth.session.role);
  if (!doc) return fail("Choose which kind of record this is.", { kind: "Required." });
  if (!doc.slug) {
    return fail("A URL slug is required.", { slug: "Enter a name, or a slug." });
  }

  let kind: PersonKind;
  try {
    const existing = await Person.findById(id);
    if (!existing) return fail("That record no longer exists. It may have been deleted.");

    // Assigning onto the document rather than using `findByIdAndUpdate` is what
    // runs the schema's `validate` and `save` hooks — the ones that require a
    // senator to carry a district and stamp `publishedAt` on first publish.
    Object.assign(existing, writable(doc, OPTIONAL_ENUMS));

    // A cleared date arrives as null; Mongoose only unsets it when told to.
    if (doc.tenureStart === null) existing.set("tenureStart", undefined);
    if (doc.tenureEnd === null) existing.set("tenureEnd", undefined);
    if (doc.portrait === null) existing.set("portrait", undefined);

    await existing.save();
    kind = existing.kind;
  } catch (error) {
    return fromDatabaseError(error, "update person");
  }

  revalidateFor("people");
  redirect(`/admin/people?kind=${kind}&saved=${encodeURIComponent(doc.slug)}`);
}

/**
 * Deleting requires the `delete` capability, which only an owner holds.
 *
 * The record's Cloudinary portrait is deliberately left in place. It may be
 * reused by another record, and an unreferenced image costs a few kilobytes,
 * whereas destroying one still in use breaks a live page.
 */
export async function deletePerson(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/people?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }

  const id = str(form, "id");
  const kind = str(form, "kind") ?? "leader";
  if (!id) redirect("/admin/people");

  try {
    await Person.findByIdAndDelete(id);
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[admin] delete person failed: ${name}`);
    redirect(`/admin/people?kind=${kind}&error=${encodeURIComponent("Could not delete that record.")}`);
  }

  revalidateFor("people");
  redirect(`/admin/people?kind=${kind}&deleted=1`);
}
