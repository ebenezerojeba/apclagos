"use client";

import Link from "next/link";
import { AdminField, AdminTextarea } from "@/components/admin/AdminField";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * Create or rename a category.
 *
 * One component for both, distinguished by whether `initial.id` is present. The
 * parent remounts it with a `key` when the selection changes, which is what
 * resets the uncontrolled inputs to the newly selected record — without it the
 * browser would keep the previous category's text in the fields.
 */

export interface CategoryInitial {
  id?: string;
  name: string;
  slug: string;
  description: string;
  order?: number;
}

export function CategoryForm({
  action,
  initial,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: CategoryInitial;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5">
      <h2 className="font-display text-lg text-fg">
        {initial.id ? "Edit category" : "New category"}
      </h2>

      <AdminForm action={action} className="mt-5 space-y-4">
        {(state) => {
          const errors = state.fieldErrors ?? {};

          return (
            <>
              {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

              <AdminField
                id="category-name"
                name="name"
                label="Name"
                required
                defaultValue={initial.name}
                error={errors.name}
              />
              <AdminField
                id="category-slug"
                name="slug"
                label="URL slug"
                hint="Left blank, this is generated from the name."
                defaultValue={initial.slug}
                error={errors.slug}
              />
              <AdminTextarea
                id="category-description"
                name="description"
                label="Description"
                rows={3}
                defaultValue={initial.description}
                error={errors.description}
              />
              <AdminField
                id="category-order"
                name="order"
                label="Sort order"
                type="number"
                hint="Lower numbers appear first."
                defaultValue={initial.order ?? ""}
                error={errors.order}
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <SubmitButton>{initial.id ? "Save" : "Add category"}</SubmitButton>
                {initial.id ? (
                  <Link
                    href="/admin/categories"
                    className="rounded-full px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                  >
                    Cancel
                  </Link>
                ) : null}
              </div>
            </>
          );
        }}
      </AdminForm>
    </div>
  );
}
