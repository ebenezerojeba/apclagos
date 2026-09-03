"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import type { ImageAsset } from "@/types/content";

/**
 * Masonry album grid.
 *
 * Uses CSS columns so each photograph keeps its own aspect ratio without any
 * measurement in JavaScript — the layout is correct before hydration and stays
 * correct at every breakpoint. Each tile is a button that opens the lightbox at
 * that index.
 */
export function AlbumGrid({
  images,
  albumTitle,
}: {
  images: ImageAsset[];
  albumTitle: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block w-full overflow-hidden rounded-xl bg-paper-200"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width ?? 1200}
                height={image.height ?? 800}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                loading={index < 6 ? "eager" : "lazy"}
                className="h-auto w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/15"
              />
              {image.caption ? (
                <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink-950/85 to-transparent p-4 text-left text-sm text-white transition-transform duration-300 group-hover:translate-y-0">
                  {image.caption}
                </span>
              ) : null}
              <span className="sr-only">
                Open image {index + 1} of {images.length}: {image.alt}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        images={images}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
        albumTitle={albumTitle}
      />
    </>
  );
}
