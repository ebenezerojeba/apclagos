"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { AdminField } from "@/components/admin/AdminField";
import { AdminForm, SubmitButton } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * One asset in the library.
 *
 * The editing fields are collapsed by default. A grid of thirty cards, each
 * with four open inputs, is unreadable and slow to render; the thumbnail plus a
 * description is what the page is actually for.
 */

export interface MediaAsset {
  id: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  alt: string;
  caption: string;
  credit: string;
  tags: string[];
}

export function MediaCard({
  action,
  deleteAction,
  asset,
  canDelete,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  deleteAction: (form: FormData) => Promise<void>;
  asset: MediaAsset;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.secureUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the URL is visible in the field below
      // either way, so there is nothing to recover from.
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="relative aspect-[4/3] bg-paper-200">
        <Image
          src={asset.secureUrl}
          alt={asset.alt || ""}
          fill
          sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate font-mono text-xs text-fg-subtle" title={asset.publicId}>
          {asset.publicId}
        </p>
        <p className="tnum mt-1 text-xs text-fg-muted">
          {asset.width} × {asset.height} · {asset.format.toUpperCase()} ·{" "}
          {(asset.bytes / 1024).toFixed(0)} KB
        </p>

        <p className="mt-2 flex-1 text-[0.8125rem] leading-relaxed text-fg">
          {asset.alt || (
            <span className="text-crimson-700">No alternative text — add one below.</span>
          )}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            {open ? "Close" : "Edit details"}
          </button>
          <button
            type="button"
            onClick={copyUrl}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            {copied ? (
              <Check className="size-3.5 text-verdant-600" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy URL"}
          </button>
        </div>

        {open ? (
          <div className="mt-4 border-t border-border-subtle pt-4">
            <AdminForm action={action} className="space-y-3">
              {(state) => {
                const errors = state.fieldErrors ?? {};
                return (
                  <>
                    <input type="hidden" name="id" value={asset.id} />
                    <AdminField
                      id={`alt-${asset.id}`}
                      name="alt"
                      label="Alternative text"
                      required
                      defaultValue={asset.alt}
                      error={errors.alt}
                    />
                    <AdminField
                      id={`caption-${asset.id}`}
                      name="caption"
                      label="Caption"
                      defaultValue={asset.caption}
                      error={errors.caption}
                    />
                    <AdminField
                      id={`credit-${asset.id}`}
                      name="credit"
                      label="Credit"
                      defaultValue={asset.credit}
                      error={errors.credit}
                    />
                    <AdminField
                      id={`tags-${asset.id}`}
                      name="tags"
                      label="Tags"
                      hint="Comma separated."
                      defaultValue={asset.tags.join(", ")}
                      error={errors.tags}
                    />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <SubmitButton className="h-9 px-4 text-[0.8125rem]">Save</SubmitButton>
                    </div>
                  </>
                );
              }}
            </AdminForm>

            {canDelete ? (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <p className="mb-2 text-xs leading-relaxed text-fg-muted">
                  Deleting removes the file from Cloudinary permanently. Any
                  record already using it will show a broken image.
                </p>
                <DeleteButton
                  action={deleteAction}
                  id={asset.id}
                  extra={{ publicId: asset.publicId }}
                  describe={asset.publicId}
                  label="Delete file"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
