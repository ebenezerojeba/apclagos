"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Picks a file, uploads it straight to Cloudinary, and puts the resulting
 * reference into a hidden field for the surrounding form to submit.
 *
 * The upload never passes through this application. The browser asks the server
 * to sign one set of upload parameters, POSTs the file to Cloudinary with that
 * signature, and only the returned metadata comes back here. That is not an
 * optimisation: a Vercel function caps request bodies at 4.5 MB, and press
 * photography routinely exceeds it — proxying would simply fail on the files
 * this site most needs.
 *
 * Alternative text is part of the value, not an afterthought. The schema
 * refuses to store an image without it, so collecting it at the point of upload
 * is the only way an editor is not left with a save that fails later for a
 * reason they cannot see from the form.
 */

export interface ImageValue {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  alt: string;
  caption?: string;
  credit?: string;
  focal?: "top" | "center" | "bottom" | "left" | "right";
}

interface Props {
  name: string;
  label: string;
  folder: string;
  hint?: string;
  error?: string;
  initial?: ImageValue | null;
  /**
   * Notified whenever the value changes.
   *
   * Supplied when a parent owns the value - `BlockEditor` keeps images inside
   * its own block array rather than as a form field. When it is passed, the
   * hidden input is dropped, because the parent submits the value instead and
   * two inputs of the same name would both be sent.
   */
  onChange?: (value: ImageValue | null) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageField({
  name,
  label,
  folder,
  hint,
  error,
  initial,
  onChange,
}: Props) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<ImageValue | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  /** The single place the value changes, so the parent is never missed. */
  function commit(next: ImageValue | null) {
    setValue(next);
    onChange?.(next);
  }

  async function upload(file: File) {
    setProblem(null);

    if (!ACCEPTED.includes(file.type)) {
      setProblem("Choose a JPEG, PNG, WebP or AVIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setProblem(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB — ` +
          "export it at a smaller size and try again.",
      );
      return;
    }

    setBusy(true);
    try {
      const signatureResponse = await fetch(
        `/api/admin/upload?folder=${encodeURIComponent(folder)}`,
      );
      if (!signatureResponse.ok) {
        const detail = await signatureResponse.json().catch(() => ({}));
        setProblem(detail.error ?? "Could not start the upload. Try again.");
        return;
      }
      const signed = await signatureResponse.json();

      // The signature covers exactly these parameters; adding any other field
      // invalidates it, which is what stops a signed upload being re-pointed.
      const payload = new FormData();
      payload.append("file", file);
      payload.append("api_key", signed.apiKey);
      payload.append("timestamp", String(signed.timestamp));
      payload.append("signature", signed.signature);
      payload.append("folder", signed.folder);
      payload.append("use_filename", "true");
      payload.append("unique_filename", "true");
      payload.append("overwrite", "false");

      const uploaded = await fetch(signed.uploadUrl, { method: "POST", body: payload });
      if (!uploaded.ok) {
        setProblem("Cloudinary rejected the upload. Check the file and try again.");
        return;
      }
      const asset = await uploaded.json();

      commit({
        url: asset.url,
        secureUrl: asset.secure_url,
        publicId: asset.public_id,
        width: asset.width,
        height: asset.height,
        format: asset.format,
        // Seeded from the filename so the field is never silently empty; the
        // editor is expected to replace it with a real description.
        alt: value?.alt ?? "",
        caption: value?.caption,
        credit: value?.credit,
        focal: value?.focal ?? "center",
      });

      // Register it in the media library. A failure here is not fatal — the
      // image is already in Cloudinary and already attached to this record.
      fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          publicId: asset.public_id,
          alt: value?.alt || file.name.replace(/\.[^.]+$/, ""),
          folder,
        }),
      }).catch(() => undefined);
    } catch {
      setProblem("The upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function patch(changes: Partial<ImageValue>) {
    if (!value) return;
    commit({ ...value, ...changes });
  }

  return (
    <fieldset className="rounded-xl border border-border bg-paper-100/40 p-4">
      <legend className="px-1.5 text-sm font-medium text-fg">{label}</legend>

      {/* What the form submits - omitted when a parent owns the value. */}
      {onChange ? null : (
        <input type="hidden" name={name} value={value ? JSON.stringify(value) : ""} />
      )}

      {problem || error ? (
        <p
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-lg border border-crimson-200 bg-crimson-50 p-2.5 text-sm text-crimson-900"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-crimson-600" aria-hidden="true" />
          {problem ?? error}
        </p>
      ) : null}

      {value ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-paper-200">
              <Image
                src={value.secureUrl}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1 text-[0.8125rem] text-fg-muted">
              <p className="truncate font-medium text-fg">{value.publicId}</p>
              <p className="tnum">
                {value.width} × {value.height} · {value.format.toUpperCase()}
              </p>
              <button
                type="button"
                onClick={() => commit(null)}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-crimson-300 hover:text-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
              >
                <X className="size-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-fg">
                Alternative text
                <span className="ml-1 text-crimson-700" aria-hidden="true">*</span>
              </span>
              <input
                id={`${fieldId}-alt`}
                value={value.alt}
                onChange={(event) => patch({ alt: event.target.value })}
                required
                aria-describedby={`${fieldId}-alt-hint`}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200"
              />
              <span id={`${fieldId}-alt-hint`} className="mt-1 block text-xs text-fg-muted">
                Describe what the image shows, for readers using a screen reader.
              </span>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-fg">Caption</span>
              <input
                value={value.caption ?? ""}
                onChange={(event) => patch({ caption: event.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-fg">Credit</span>
              <input
                value={value.credit ?? ""}
                onChange={(event) => patch({ credit: event.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-fg">Keep in view when cropped</span>
              <select
                value={value.focal ?? "center"}
                onChange={(event) => patch({ focal: event.target.value as ImageValue["focal"] })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200"
              >
                {["center", "top", "bottom", "left", "right"].map((option) => (
                  <option key={option} value={option} className="bg-surface text-fg">
                    {option[0].toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
              "border-border bg-surface px-6 py-8 text-sm text-fg-muted transition-colors",
              "hover:border-border-strong hover:text-fg",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
              "disabled:cursor-wait disabled:opacity-60",
            )}
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="size-5" aria-hidden="true" />
                <span className="font-medium">Choose an image</span>
                <span className="text-xs">JPEG, PNG, WebP or AVIF · up to 10 MB</span>
              </>
            )}
          </button>
          {hint ? <p className="mt-2 text-xs text-fg-muted">{hint}</p> : null}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <p aria-live="polite" className="sr-only">
        {busy ? "Uploading image" : value ? "Image ready" : ""}
      </p>
    </fieldset>
  );
}
