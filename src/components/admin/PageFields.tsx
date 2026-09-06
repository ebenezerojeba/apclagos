"use client";

import { AdminField, AdminTextarea } from "@/components/admin/AdminField";
import { EditorialForm, type EditorialInitial } from "@/components/admin/EditorialForm";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * `EditorialForm` with the fields particular to an institutional page.
 */

export interface PageInitial extends EditorialInitial {
  eyebrow?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export function PageFormScreen({
  action,
  initial,
  canPublish,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: PageInitial;
  canPublish: boolean;
}) {
  return (
    <EditorialForm
      action={action}
      initial={initial}
      canPublish={canPublish}
      folder="pages"
      cancelHref="/admin/pages"
      titleLabel="Page title"
      summaryName="description"
      summaryLabel="Description"
      summaryHint="Shown beneath the title. Also used as the meta description unless one is set below."
      extras={(errors) => (
        <AdminField
          id="eyebrow"
          name="eyebrow"
          label="Eyebrow"
          hint="A short label above the title."
          defaultValue={initial.eyebrow}
          error={errors.eyebrow}
        />
      )}
      footerExtras={(errors) => (
        <div className="space-y-4">
          <p className="text-[0.8125rem] text-fg-muted">
            Search engines and social platforms use these when they differ from
            the title and description above. Leave them blank to reuse those.
          </p>
          <AdminField
            id="metaTitle"
            name="metaTitle"
            label="Meta title"
            defaultValue={initial.metaTitle}
            error={errors.metaTitle}
          />
          <AdminTextarea
            id="metaDescription"
            name="metaDescription"
            label="Meta description"
            rows={2}
            hint="Around 150 characters reads best in a search result."
            defaultValue={initial.metaDescription}
            error={errors.metaDescription}
          />
        </div>
      )}
    />
  );
}
