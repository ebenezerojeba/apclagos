"use client";

import Link from "next/link";
import { AdminField, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { Section } from "@/components/admin/EditorialForm";
import { GalleryImagesField } from "@/components/admin/GalleryImagesField";
import { ImageField, type ImageValue } from "@/components/admin/ImageField";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * Create or edit a gallery album.
 *
 * Photographs come first on the screen because they are the album; the
 * details below them are what make it findable. The separate cover is optional
 * and sits after the photographs for that reason — most albums should simply
 * use their first picture, which the tile list marks as the cover.
 */

export interface AlbumInitial {
  id?: string;
  slug: string;
  status: string;
  order?: number;
  title: string;
  description?: string;
  category: string;
  date?: string;
  location?: string;
  relatedEventSlug?: string;
  cover?: ImageValue | null;
  images: ImageValue[];
}

const CATEGORIES = [
  { value: "events", label: "Events" },
  { value: "campaign", label: "Campaign" },
  { value: "congress", label: "Congress" },
  { value: "leadership", label: "Leadership" },
  { value: "community", label: "Community" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "draft", label: "Draft — not visible on the site" },
  { value: "published", label: "Published — live on the site" },
  { value: "archived", label: "Archived — kept but hidden" },
];

export function AlbumForm({
  action,
  initial,
  canPublish,
  events,
  maxImages,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: AlbumInitial;
  canPublish: boolean;
  events: { slug: string; title: string }[];
  maxImages: number;
}) {
  return (
    <AdminForm action={action}>
      {(state) => {
        const errors = state.fieldErrors ?? {};

        return (
          <>
            {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

            <Section
              title="Photographs"
              hint="Select several at once. Every photograph needs a description before the album can be saved."
            >
              <GalleryImagesField
                name="images"
                folder="gallery"
                initial={initial.images}
                error={errors.images}
                max={maxImages}
              />
            </Section>

            <Section title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="title"
                  name="title"
                  label="Album title"
                  required
                  defaultValue={initial.title}
                  error={errors.title}
                  className="sm:col-span-2"
                />
                <AdminTextarea
                  id="description"
                  name="description"
                  label="Description"
                  rows={3}
                  hint="A sentence or two about the occasion."
                  defaultValue={initial.description}
                  error={errors.description}
                  className="sm:col-span-2"
                />
                <AdminSelect
                  id="category"
                  name="category"
                  label="Category"
                  options={CATEGORIES}
                  defaultValue={initial.category}
                  error={errors.category}
                />
                <AdminField
                  id="date"
                  name="date"
                  label="Date"
                  type="date"
                  hint="When the photographs were taken. Albums are listed newest first."
                  defaultValue={initial.date}
                  error={errors.date}
                />
                <AdminField
                  id="location"
                  name="location"
                  label="Location"
                  defaultValue={initial.location}
                  error={errors.location}
                />
                <AdminSelect
                  id="relatedEventSlug"
                  name="relatedEventSlug"
                  label="Related event"
                  placeholder="None"
                  options={events.map((event) => ({ value: event.slug, label: event.title }))}
                  hint={events.length === 0 ? "No events exist yet." : "Optional. Links the album from the event page."}
                  defaultValue={initial.relatedEventSlug}
                  error={errors.relatedEventSlug}
                />
              </div>
            </Section>

            <Section
              title="Cover"
              hint="Optional. Leave empty and the first photograph is used."
            >
              <ImageField
                name="cover"
                label="Separate cover image"
                folder="gallery"
                initial={initial.cover ?? null}
                error={errors.cover}
              />
            </Section>

            <Section title="Publication">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="slug"
                  name="slug"
                  label="URL slug"
                  hint={
                    initial.id
                      ? "Changing this changes the album's address. Existing links will break."
                      : "Left blank, this is generated from the title."
                  }
                  defaultValue={initial.slug}
                  error={errors.slug}
                />
                <AdminSelect
                  id="status"
                  name="status"
                  label="Status"
                  options={canPublish ? STATUSES : STATUSES.filter((status) => status.value !== "published")}
                  defaultValue={initial.status}
                  hint={
                    canPublish
                      ? undefined
                      : "Your role can draft but not publish. An editor can publish this for you."
                  }
                  error={errors.status}
                />
                <AdminField
                  id="order"
                  name="order"
                  label="Sort order"
                  type="number"
                  hint="Lower numbers appear first among albums from the same date."
                  defaultValue={initial.order ?? ""}
                  error={errors.order}
                />
              </div>
            </Section>

            <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
              <SubmitButton>{initial.id ? "Save changes" : "Create album"}</SubmitButton>
              <Link
                href="/admin/gallery"
                className="rounded-full px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
              >
                Cancel
              </Link>
            </div>
          </>
        );
      }}
    </AdminForm>
  );
}
