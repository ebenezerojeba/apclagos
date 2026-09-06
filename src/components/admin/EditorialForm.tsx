"use client";

import Link from "next/link";
import { AdminField, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { BlockEditor, type Block } from "@/components/admin/BlockEditor";
import { ImageField, type ImageValue } from "@/components/admin/ImageField";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * The form behind articles, events and pages.
 *
 * All three are a headline, a summary, a cover image, a block body and a
 * publication state; they differ by a handful of fields each, passed in as
 * `extras`. Three separate components would mean three places to fix a spacing
 * bug and three chances for the publication controls to drift apart.
 */

export interface EditorialInitial {
  id?: string;
  slug: string;
  status: string;
  order?: number;
  title: string;
  summary: string;
  cover?: ImageValue | null;
  body: Block[];
}

const STATUSES = [
  { value: "draft", label: "Draft — not visible on the site" },
  { value: "published", label: "Published — live on the site" },
  { value: "archived", label: "Archived — kept but hidden" },
];

export function EditorialForm({
  action,
  initial,
  canPublish,
  folder,
  cancelHref,
  titleLabel,
  summaryName,
  summaryLabel,
  summaryHint,
  /** Rendered between the summary and the body — the per-collection fields. */
  extras,
  /** Rendered after the body, for anything that belongs below the content. */
  footerExtras,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  initial: EditorialInitial;
  canPublish: boolean;
  folder: string;
  cancelHref: string;
  titleLabel: string;
  /**
   * The model's field name for the summary: articles store `excerpt`, events
   * and pages store `summary`. Named explicitly rather than derived from the
   * label, so renaming a label can never silently write to the wrong field.
   */
  summaryName: "excerpt" | "summary" | "description";
  summaryLabel: string;
  summaryHint: string;
  extras?: (errors: Record<string, string>) => React.ReactNode;
  footerExtras?: (errors: Record<string, string>) => React.ReactNode;
}) {
  return (
    <AdminForm action={action}>
      {(state) => {
        const errors = state.fieldErrors ?? {};

        return (
          <>
            {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

            <Section title="Content">
              <div className="space-y-4">
                <AdminField
                  id="title"
                  name="title"
                  label={titleLabel}
                  required
                  defaultValue={initial.title}
                  error={errors.title}
                />
                <AdminTextarea
                  id="summary"
                  name={summaryName}
                  label={summaryLabel}
                  rows={3}
                  required={summaryName !== "description"}
                  hint={summaryHint}
                  defaultValue={initial.summary}
                  error={errors[summaryName]}
                />
                {extras ? extras(errors) : null}
              </div>
            </Section>

            <Section title="Cover image">
              <ImageField
                name="cover"
                label="Cover"
                folder={folder}
                hint="Shown at the top of the page and on every card that links to it."
                initial={initial.cover ?? null}
                error={errors.cover}
              />
            </Section>

            <Section
              title="Body"
              hint="Built from blocks rather than free markup, so the page renders consistently and nothing unsafe can be stored."
            >
              <BlockEditor name="body" folder={folder} initial={initial.body} />
            </Section>

            {footerExtras ? <Section title="Details">{footerExtras(errors)}</Section> : null}

            <Section title="Publication">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField
                  id="slug"
                  name="slug"
                  label="URL slug"
                  hint={
                    initial.id
                      ? "Changing this changes the page's address. Existing links will break."
                      : "Left blank, this is generated from the title."
                  }
                  defaultValue={initial.slug}
                  error={errors.slug}
                />
                <AdminSelect
                  id="status"
                  name="status"
                  label="Status"
                  options={
                    canPublish
                      ? STATUSES
                      : STATUSES.filter((status) => status.value !== "published")
                  }
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
                  hint="Lower numbers appear first. Leave blank for the default order."
                  defaultValue={initial.order ?? ""}
                  error={errors.order}
                />
              </div>
            </Section>

            <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-6">
              <SubmitButton>{initial.id ? "Save changes" : "Create"}</SubmitButton>
              <Link
                href={cancelHref}
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

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg text-fg">{title}</h2>
      {hint ? <p className="mt-1 text-[0.8125rem] text-fg-muted">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
