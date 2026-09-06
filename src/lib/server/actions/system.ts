"use server";

import { redirect } from "next/navigation";
import { Media, Settings } from "../models";
import { destroyAsset } from "../cloudinary";
import { guard } from "../admin/guard";
import { revalidateFor } from "../admin/revalidate";
import {
  csv,
  fail,
  fromDatabaseError,
  image,
  lines,
  str,
  type ActionState,
} from "../admin/forms";

/**
 * Site settings and the media library.
 */

/* -------------------------------------------------------------------------- */
/*  Settings                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Saves the single settings document.
 *
 * An upsert keyed on `key: "site"` rather than a find-then-create, because two
 * editors saving at once would otherwise both find nothing and both insert,
 * and only the unique index would stop the second — as an error, in front of
 * someone who did nothing wrong.
 */
export async function saveSettings(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("settings");
  if (!auth.ok) return auth.state;

  const logo = image(form, "logo");

  const update: Record<string, unknown> = {
    organisationName: str(form, "organisationName"),
    tagline: str(form, "tagline"),
    description: str(form, "description"),
    addressLines: lines(form, "addressLines"),
    city: str(form, "city"),
    state: str(form, "state"),
    phones: lines(form, "phones"),
    emails: lines(form, "emails"),
    openingHours: str(form, "openingHours"),
    mapQuery: str(form, "mapQuery"),
    social: {
      facebook: str(form, "social.facebook"),
      x: str(form, "social.x"),
      instagram: str(form, "social.instagram"),
      linkedin: str(form, "social.linkedin"),
      youtube: str(form, "social.youtube"),
    },
  };
  if (logo) update.logo = logo;

  try {
    await Settings.findOneAndUpdate(
      { key: "site" },
      logo === null ? { $set: update, $unset: { logo: "" } } : { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
  } catch (error) {
    return fromDatabaseError(error, "save settings");
  }

  revalidateFor("settings");
  redirect("/admin/settings?saved=1");
}

/* -------------------------------------------------------------------------- */
/*  Media library                                                              */
/* -------------------------------------------------------------------------- */

/** Updates the descriptive fields of an asset. The binary is never touched. */
export async function updateMedia(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  const auth = await guard("write");
  if (!auth.ok) return auth.state;

  const id = str(form, "id");
  if (!id) return fail("That asset could not be identified.");

  const alt = str(form, "alt");
  if (!alt) {
    return fail("Alternative text is required.", {
      alt: "Describe the image for someone who cannot see it.",
    });
  }

  try {
    await Media.findByIdAndUpdate(
      id,
      {
        alt,
        caption: str(form, "caption"),
        credit: str(form, "credit"),
        tags: csv(form, "tags"),
      },
      { runValidators: true },
    );
  } catch (error) {
    return fromDatabaseError(error, "update media");
  }

  redirect("/admin/media?saved=1");
}

/**
 * Removes an asset from Cloudinary and from the library.
 *
 * Order matters: Cloudinary first, then the row. If the remote delete fails the
 * row survives, so the asset stays visible in the library and can be retried.
 * Deleting the row first would strand the file with nothing pointing at it.
 *
 * Records that embedded this image keep their copy of the reference and will
 * render a broken image — which is why the confirmation names that risk. A
 * cascade across every collection is the wrong trade here: it would let one
 * click blank the portrait on a live officeholder page.
 */
export async function deleteMedia(form: FormData): Promise<void> {
  const auth = await guard("delete");
  if (!auth.ok) {
    redirect(`/admin/media?error=${encodeURIComponent(auth.state.error ?? "Not permitted.")}`);
  }

  const id = str(form, "id");
  const publicId = str(form, "publicId");
  if (!id) redirect("/admin/media");

  if (publicId) {
    const destroyed = await destroyAsset(publicId);
    if (!destroyed) {
      redirect(
        `/admin/media?error=${encodeURIComponent(
          "Could not remove that file from Cloudinary, so it was kept here too.",
        )}`,
      );
    }
  }

  await Media.findByIdAndDelete(id).catch(() => null);
  redirect("/admin/media?deleted=1");
}
