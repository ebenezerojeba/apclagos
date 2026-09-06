"use client";

import { AdminField, AdminSelect } from "@/components/admin/AdminField";
import { EditorialForm, type EditorialInitial } from "@/components/admin/EditorialForm";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * `EditorialForm` with the fields particular to an article.
 *
 * The categories come from the database and so must be passed in from the
 * server component that rendered this — a client component cannot query.
 */

export interface ArticleInitial extends EditorialInitial {
  type: string;
  kicker?: string;
  category?: string;
  tags: string[];
  authorName?: string;
  authorRole?: string;
  featured: boolean;
  publishedAt?: string;
}

const TYPES = [
  { value: "news", label: "News" },
  { value: "announcement", label: "Announcement" },
  { value: "press-release", label: "Press release" },
];

export function ArticleFormScreen({
  action,
  initial,
  canPublish,
  categories,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: ArticleInitial;
  canPublish: boolean;
  categories: { id: string; name: string }[];
}) {
  return (
    <EditorialForm
      action={action}
      initial={initial}
      canPublish={canPublish}
      folder="news"
      cancelHref="/admin/articles"
      titleLabel="Headline"
      summaryName="excerpt"
      summaryLabel="Excerpt"
      summaryHint="One or two sentences. Used on cards and as the page's meta description, so write it for someone who has not read the article."
      extras={(errors) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminSelect
            id="type"
            name="type"
            label="Type"
            options={TYPES}
            defaultValue={initial.type}
            error={errors.type}
          />
          <AdminSelect
            id="category"
            name="category"
            label="Category"
            placeholder="Uncategorised"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            defaultValue={initial.category}
            hint={
              categories.length === 0
                ? "No categories exist yet. Add some under Categories."
                : undefined
            }
            error={errors.category}
          />
          <AdminField
            id="kicker"
            name="kicker"
            label="Kicker"
            hint="A short line above the headline."
            defaultValue={initial.kicker}
            error={errors.kicker}
            className="sm:col-span-2"
          />
        </div>
      )}
      footerExtras={(errors) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField
            id="authorName"
            name="authorName"
            label="Author"
            defaultValue={initial.authorName}
            error={errors.authorName}
          />
          <AdminField
            id="authorRole"
            name="authorRole"
            label="Author's role"
            defaultValue={initial.authorRole}
            error={errors.authorRole}
          />
          <AdminField
            id="tags"
            name="tags"
            label="Tags"
            hint="Comma separated."
            defaultValue={initial.tags.join(", ")}
            error={errors.tags}
          />
          <AdminField
            id="publishedAt"
            name="publishedAt"
            label="Publication date"
            type="datetime-local"
            hint="Leave blank to stamp the moment it is first published."
            defaultValue={initial.publishedAt}
            error={errors.publishedAt}
          />
          <label className="flex items-start gap-3 sm:col-span-2">
            <input type="hidden" name="featured" value="0" />
            <input
              type="checkbox"
              name="featured"
              value="1"
              defaultChecked={initial.featured}
              className="mt-0.5 size-4 rounded border-border accent-ink-900"
            />
            <span className="text-sm">
              <span className="font-medium text-fg">Featured</span>
              <span className="mt-0.5 block text-fg-muted">
                Give this article prominence on the homepage and in the newsroom.
              </span>
            </span>
          </label>
        </div>
      )}
    />
  );
}
