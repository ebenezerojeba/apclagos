"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, uploadImage } from "@/components/admin/upload";
import type { ImageValue } from "@/components/admin/ImageField";

/**
 * The photographs in an album.
 *
 * Built for how an album actually arrives: forty pictures from one rally,
 * selected in one go from a folder. So the picker takes many files at once and
 * uploads them in parallel — three at a time, which is fast without having the
 * browser open forty connections and stall on the slowest — and a failed file
 * is reported against its own name while the rest carry on.
 *
 * Every photograph needs alternative text, and the save is refused until each
 * has one. Writing forty descriptions by hand is exactly the chore that gets
 * skipped, so "Describe all" fills every empty description with one sentence
 * the editor can then refine where a picture deserves more.
 *
 * Order matters — the first photograph is the album's cover unless a separate
 * cover is chosen — so each tile can be moved, or sent to the front.
 */

const CONCURRENCY = 3;

interface PendingUpload {
  key: string;
  name: string;
  error?: string;
}

const CONTROL =
  "h-9 w-full rounded-lg border bg-surface px-2.5 text-[0.8125rem] text-fg " +
  "focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200";

export function GalleryImagesField({
  name,
  folder,
  initial,
  error,
  max,
}: {
  name: string;
  folder: string;
  initial: ImageValue[];
  error?: string;
  max: number;
}) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageValue[]>(initial);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [bulkAlt, setBulkAlt] = useState("");

  const uploading = pending.some((entry) => !entry.error);
  const failures = pending.filter((entry) => entry.error);
  const missingAlt = images.filter((image) => !image.alt.trim()).length;
  const room = max - images.length;

  async function addFiles(fileList: FileList) {
    const files = Array.from(fileList).slice(0, Math.max(room, 0));
    if (files.length === 0) return;

    const queue = files.map((file, index) => ({
      file,
      key: `${Date.now()}-${index}-${file.name}`,
    }));
    setPending((current) => [
      ...current.filter((entry) => !entry.error),
      ...queue.map(({ key, file }) => ({ key, name: file.name })),
    ]);

    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const { file, key } = queue[cursor];
        cursor += 1;
        const result = await uploadImage(file, folder);
        if (result.ok) {
          setImages((current) =>
            current.length >= max
              ? current
              : [...current, { ...result.image, alt: "", focal: "center" }],
          );
          setPending((current) => current.filter((entry) => entry.key !== key));
        } else {
          setPending((current) =>
            current.map((entry) =>
              entry.key === key ? { ...entry, error: result.error } : entry,
            ),
          );
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  function patch(index: number, changes: Partial<ImageValue>) {
    setImages((current) =>
      current.map((image, position) => (position === index ? { ...image, ...changes } : image)),
    );
  }

  function move(index: number, to: number) {
    setImages((current) => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      const [picked] = next.splice(index, 1);
      next.splice(to, 0, picked);
      return next;
    });
  }

  function remove(index: number) {
    setImages((current) => current.filter((_, position) => position !== index));
  }

  function describeAll() {
    const text = bulkAlt.trim();
    if (!text) return;
    setImages((current) =>
      current.map((image) => (image.alt.trim() ? image : { ...image, alt: text })),
    );
    setBulkAlt("");
  }

  return (
    <fieldset className="rounded-xl border border-border bg-paper-100/40 p-4">
      <legend className="px-1.5 text-sm font-medium text-fg">
        Photographs{" "}
        <span className="tnum font-normal text-fg-muted">
          ({images.length} of {max})
        </span>
      </legend>

      {/* What the form submits. */}
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      {error ? (
        <p
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-lg border border-crimson-200 bg-crimson-50 p-2.5 text-sm text-crimson-900"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-crimson-600" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={room <= 0}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
          "border-border bg-surface px-6 py-7 text-sm text-fg-muted transition-colors",
          "hover:border-border-strong hover:text-fg",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <ImagePlus className="size-5" aria-hidden="true" />
        )}
        <span className="font-medium">
          {room <= 0
            ? "This album is full"
            : uploading
              ? `Uploading ${pending.filter((entry) => !entry.error).length} photograph(s)…`
              : "Add photographs"}
        </span>
        <span className="text-xs">
          Select several at once · JPEG, PNG, WebP or AVIF · up to 10 MB each
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files?.length) void addFiles(event.target.files);
        }}
      />

      {failures.length > 0 ? (
        <ul className="mt-3 space-y-1.5" role="alert">
          {failures.map((entry) => (
            <li
              key={entry.key}
              className="flex items-start justify-between gap-3 rounded-lg border border-crimson-200 bg-crimson-50 px-3 py-2 text-[0.8125rem] text-crimson-900"
            >
              <span>
                <strong className="font-medium">{entry.name}</strong> — {entry.error}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPending((current) => current.filter((item) => item.key !== entry.key))
                }
                aria-label={`Dismiss the error for ${entry.name}`}
                className="shrink-0 rounded text-crimson-700 hover:text-crimson-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink-600"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 && missingAlt > 0 ? (
        <div className="mt-4 rounded-lg border border-brass-200 bg-brass-100/60 p-3">
          <label htmlFor={`${fieldId}-bulk`} className="text-[0.8125rem] font-medium text-fg">
            {missingAlt} photograph{missingAlt === 1 ? " has" : "s have"} no description
          </label>
          <p className="mt-0.5 text-xs text-fg-muted">
            Fill every empty one with the same sentence, then refine any that deserve more.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              id={`${fieldId}-bulk`}
              value={bulkAlt}
              onChange={(event) => setBulkAlt(event.target.value)}
              onKeyDown={(event) => {
                // Enter would otherwise submit the whole album form.
                if (event.key === "Enter") {
                  event.preventDefault();
                  describeAll();
                }
              }}
              placeholder="e.g. Supporters at the Ikeja ward congress"
              className={cn(CONTROL, "border-border")}
            />
            <button
              type="button"
              onClick={describeAll}
              disabled={!bulkAlt.trim()}
              className="shrink-0 rounded-lg bg-ink-900 px-3 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600 disabled:opacity-50"
            >
              Describe all
            </button>
          </div>
        </div>
      ) : null}

      {images.length > 0 ? (
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => {
            const needsAlt = !image.alt.trim();
            return (
              <li
                key={image.publicId}
                className={cn(
                  "overflow-hidden rounded-xl border bg-surface",
                  needsAlt ? "border-brass-300" : "border-border",
                )}
              >
                <div className="relative aspect-[4/3] bg-paper-200">
                  <Image
                    src={image.secureUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                    unoptimized
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink-900/85 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-white">
                      <Star className="size-3" aria-hidden="true" />
                      Cover
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2 p-3">
                  <label className="block">
                    <span className="text-xs font-medium text-fg">
                      Description
                      <span className="ml-1 text-crimson-700" aria-hidden="true">*</span>
                    </span>
                    <input
                      value={image.alt}
                      onChange={(event) => patch(index, { alt: event.target.value })}
                      aria-invalid={needsAlt || undefined}
                      placeholder="What does this photograph show?"
                      className={cn(CONTROL, "mt-1", needsAlt ? "border-brass-300" : "border-border")}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-fg">Caption</span>
                    <input
                      value={image.caption ?? ""}
                      onChange={(event) => patch(index, { caption: event.target.value })}
                      className={cn(CONTROL, "mt-1 border-border")}
                    />
                  </label>

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="tnum text-xs text-fg-subtle">#{index + 1}</span>
                    <span className="flex items-center gap-1">
                      {index > 0 ? (
                        <TileButton label={`Make photograph ${index + 1} the cover`} onClick={() => move(index, 0)}>
                          <Star className="size-3.5" aria-hidden="true" />
                        </TileButton>
                      ) : null}
                      <TileButton
                        label={`Move photograph ${index + 1} earlier`}
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      </TileButton>
                      <TileButton
                        label={`Move photograph ${index + 1} later`}
                        onClick={() => move(index, index + 1)}
                        disabled={index === images.length - 1}
                      >
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      </TileButton>
                      <TileButton label={`Remove photograph ${index + 1}`} onClick={() => remove(index)} destructive>
                        <X className="size-3.5" aria-hidden="true" />
                      </TileButton>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {uploading ? "Uploading photographs" : `${images.length} photographs in this album`}
      </p>
    </fieldset>
  );
}

function TileButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-7 place-items-center rounded-md border border-border text-fg-muted transition-colors",
        "hover:border-border-strong hover:text-fg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
        "disabled:cursor-not-allowed disabled:opacity-40",
        destructive && "hover:border-crimson-300 hover:text-crimson-700",
      )}
    >
      {children}
    </button>
  );
}
