"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Modal, ModalCloseButton } from "@/components/ui/Modal";
import type { ImageAsset } from "@/types/content";

/**
 * Full-screen image viewer.
 *
 * Keyboard: Left/Right step through the album, Escape closes (handled by the
 * dialog's focus trap). The counter is announced politely so screen-reader users
 * know where they are in the set.
 */
export function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  albumTitle,
}: {
  images: ImageAsset[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  albumTitle?: string;
}) {
  const open = index !== null && images.length > 0;
  const current = open ? images[index] : undefined;

  const step = useCallback(
    (delta: number) => {
      if (index === null || images.length === 0) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  if (!current) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      align="full"
      label={albumTitle ? `${albumTitle} — image viewer` : "Image viewer"}
      backdropClassName="bg-ink-950/95 backdrop-blur-none"
      panelClassName="h-full"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            {albumTitle ? (
              <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-300">
                {albumTitle}
              </p>
            ) : null}
            <p aria-live="polite" className="tnum text-sm text-white/70">
              Image {index! + 1} of {images.length}
            </p>
          </div>
          <ModalCloseButton onClose={onClose} tone="dark" label="Close image viewer" />
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
          {images.length > 1 ? (
            <LightboxArrow direction="prev" onClick={() => step(-1)} />
          ) : null}

          <figure className="flex h-full max-h-full w-full flex-col items-center justify-center gap-4 py-2">
            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt}
                width={current.width ?? 1600}
                height={current.height ?? 1067}
                sizes="(min-width: 1024px) 80vw, 100vw"
                priority
                className="max-h-full w-auto max-w-full rounded-lg object-contain"
              />
            </div>
            {current.caption || current.credit ? (
              <figcaption className="max-w-3xl px-4 pb-2 text-center text-sm text-white/70">
                {current.caption}
                {current.credit ? (
                  <span className="mt-1 block text-xs text-white/45">
                    Photograph: {current.credit}
                  </span>
                ) : null}
              </figcaption>
            ) : null}
          </figure>

          {images.length > 1 ? (
            <LightboxArrow direction="next" onClick={() => step(1)} />
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="rail-mask shrink-0 overflow-x-auto px-4 pb-5 pt-2 sm:px-6">
            <ul className="mx-auto flex w-max gap-2">
              {images.map((image, i) => (
                <li key={`${image.src}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onIndexChange(i)}
                    aria-current={i === index ? "true" : undefined}
                    className={`relative block size-14 overflow-hidden rounded-md ring-offset-2 ring-offset-ink-950 transition-opacity sm:size-16 ${
                      i === index
                        ? "opacity-100 ring-2 ring-brass-300"
                        : "opacity-50 hover:opacity-90"
                    }`}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="sr-only">Show image {i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function LightboxArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 ${
        direction === "prev" ? "left-1 sm:left-4" : "right-1 sm:right-4"
      }`}
    >
      <Icon className="size-6" aria-hidden="true" />
      <span className="sr-only">
        {direction === "prev" ? "Previous image" : "Next image"}
      </span>
    </button>
  );
}
