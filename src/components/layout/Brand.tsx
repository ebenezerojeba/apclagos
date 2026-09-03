"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { brandLogo, siteConfig } from "@/data/site";

/**
 * The brand lockup.
 *
 * `brandLogo` in `src/data/site.ts` points at the party's own artwork. If that
 * file is missing — or fails to load for any reason — the component falls back
 * to the SVG emblem below rather than showing a broken image, so the header is
 * always intact whether or not the asset has been added yet.
 *
 * The logo is a landscape lockup, so it is sized by height with the width left
 * to follow its natural ratio; the SVG fallback is square and sized to match.
 */

/** Height in pixels for each lockup size, keyed to the Tailwind classes below. */
const EMBLEM_HEIGHT = { sm: 32, md: 40, lg: 48 } as const;

export type EmblemSize = keyof typeof EMBLEM_HEIGHT;

export function Emblem({
  size = "md",
  className,
}: {
  size?: EmblemSize;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const height = EMBLEM_HEIGHT[size];

  if (brandLogo.src && !failed) {
    const ratio = brandLogo.width / brandLogo.height;
    return (
      <Image
        src={brandLogo.src}
        alt=""
        width={Math.round(height * ratio * 2)}
        height={height * 2}
        sizes={`${Math.round(height * ratio)}px`}
        priority
        onError={() => setFailed(true)}
        className={cn("w-auto shrink-0 object-contain", className)}
        style={{ height }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      style={{ height, width: height }}
    >
      <rect width="48" height="48" rx="11" className="fill-ink-900" />
      <rect
        x="1.25"
        y="1.25"
        width="45.5"
        height="45.5"
        rx="9.75"
        fill="none"
        strokeWidth="1"
        className="stroke-brass-400/45"
      />
      {/* Three ascending strokes — the progressive motif, echoing the party's broom. */}
      <g strokeLinecap="round" strokeWidth="3">
        <path d="M13 33.5 L21 15.5" className="stroke-white" opacity="0.92" />
        <path d="M21.5 33.5 L29.5 15.5" className="stroke-crimson-400" />
        <path d="M30 33.5 L38 15.5" className="stroke-verdant-300" />
      </g>
      <path
        d="M11 37.5 H37"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="stroke-brass-300"
      />
    </svg>
  );
}

export function Wordmark({
  tone = "light",
  size = "md",
  className,
}: {
  tone?: "light" | "dark";
  size?: EmblemSize;
  className?: string;
}) {
  const dark = tone === "dark";
  const type = {
    sm: { title: "text-base", sub: "text-[0.5625rem]" },
    md: { title: "text-lg", sub: "text-[0.625rem]" },
    lg: { title: "text-xl", sub: "text-[0.6875rem]" },
  }[size];

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Emblem size={size} />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold tracking-[-0.01em]",
            type.title,
            dark ? "text-white" : "text-fg",
          )}
        >
          APC <span className={dark ? "text-brass-300" : "text-crimson-700"}>Lagos</span>
        </span>
        <span
          className={cn(
            "mt-1 font-sans font-semibold uppercase tracking-[0.14em]",
            type.sub,
            dark ? "text-ink-300" : "text-fg-subtle",
          )}
        >
          All Progressives Congress
        </span>
      </span>
    </span>
  );
}

export function BrandLink({
  tone = "light",
  size = "md",
  className,
}: {
  tone?: "light" | "dark";
  size?: EmblemSize;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center rounded-md", className)}
      aria-label={`${siteConfig.name} — home`}
    >
      <Wordmark tone={tone} size={size} />
    </Link>
  );
}
