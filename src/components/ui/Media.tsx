import Image from "next/image";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/slug";
import type { ImageAsset } from "@/types/content";

/**
 * The image system.
 *
 * Rules enforced here rather than in every consumer:
 *  - a fixed aspect box always reserves space, so images never cause layout shift;
 *  - `object-fit: cover` plus a per-image focal point, so portraits are never
 *    stretched and faces are never cropped off;
 *  - `sizes` is always supplied so the browser downloads the right file;
 *  - anything below the fold lazy-loads; only an explicitly `priority` image
 *    (the hero, an article's lead art) is eager.
 */

export const ASPECTS = {
  portrait: "aspect-3/4",
  square: "aspect-square",
  news: "aspect-16/9",
  event: "aspect-3/2",
  wide: "aspect-21/9",
  hero: "aspect-4/5 sm:aspect-16/10 lg:aspect-16/9",
  auto: "",
} as const;

export type AspectKey = keyof typeof ASPECTS;

const FOCAL: Record<NonNullable<ImageAsset["focal"]>, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

/** Common `sizes` recipes, so no consumer has to reason about breakpoints. */
export const SIZES = {
  card: "(min-width: 1280px) 22rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw",
  halfWidth: "(min-width: 1024px) 50vw, 100vw",
  feature: "(min-width: 1280px) 60rem, (min-width: 768px) 70vw, 100vw",
  full: "100vw",
  thumb: "(min-width: 640px) 8rem, 5rem",
  portrait:
    "(min-width: 1280px) 20rem, (min-width: 1024px) 28vw, (min-width: 640px) 42vw, 88vw",
} as const;

export interface SmartImageProps {
  image?: ImageAsset;
  aspect?: AspectKey;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Shown when no image has been supplied yet. */
  fallback?: React.ReactNode;
  /** Applies a gentle zoom when an ancestor with `group` is hovered. */
  zoomOnHover?: boolean;
  quality?: number;
}

export function SmartImage({
  image,
  aspect = "news",
  sizes = SIZES.card,
  priority = false,
  className,
  imageClassName,
  fallback,
  zoomOnHover = false,
  quality,
}: SmartImageProps) {
  const box = cn(
    "relative overflow-hidden bg-paper-200",
    ASPECTS[aspect],
    className,
  );

  if (!image?.src) {
    return (
      <div className={box} aria-hidden={fallback ? undefined : "true"}>
        {fallback ?? <ImagePendingPattern />}
      </div>
    );
  }

  return (
    <div className={box}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        quality={quality}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        className={cn(
          "object-cover",
          FOCAL[image.focal ?? "center"],
          zoomOnHover &&
            "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]",
          imageClassName,
        )}
      />
      {image.credit ? (
        <span className="sr-only">Photograph: {image.credit}</span>
      ) : null}
    </div>
  );
}

/** The neutral engraved pattern shown wherever artwork has not been supplied. */
export function ImagePendingPattern({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,var(--color-paper-200),var(--color-paper-300))]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0 9px, rgb(13 27 49 / 0.06) 9px 10px)",
        }}
      />
      {label ? (
        <span className="relative z-10 px-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-paper-600">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Portraits                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A person's portrait, or a monogram when no photograph has been supplied yet.
 * Never renders a stock face or an invented likeness.
 */
export function Portrait({
  image,
  name,
  aspect = "portrait",
  sizes = SIZES.portrait,
  priority,
  className,
  zoomOnHover = true,
  pendingLabel = "Photograph pending",
}: {
  image?: ImageAsset;
  name: string;
  aspect?: AspectKey;
  sizes?: string;
  priority?: boolean;
  className?: string;
  zoomOnHover?: boolean;
  pendingLabel?: string;
}) {
  return (
    <SmartImage
      image={image}
      aspect={aspect}
      sizes={sizes}
      priority={priority}
      zoomOnHover={zoomOnHover}
      className={className}
      fallback={<Monogram name={name} label={pendingLabel} />}
    />
  );
}

export function Monogram({
  name,
  label,
  className,
}: {
  name: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-ink-800),var(--color-ink-950))]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="font-display text-[clamp(2rem,8cqw,3.25rem)] font-medium tracking-[0.06em] text-brass-300/90"
      >
        {initialsOf(name)}
      </span>
      {label ? (
        <span className="px-4 text-center text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ink-300">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/** Small circular avatar for bylines and compact rows. */
export function Avatar({
  image,
  name,
  size = 40,
  className,
}: {
  image?: ImageAsset;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-ink-900 ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {image?.src ? (
        <Image
          src={image.src}
          alt={image.alt || name}
          width={size * 2}
          height={size * 2}
          sizes={`${size}px`}
          className={cn("size-full object-cover", FOCAL[image.focal ?? "center"])}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-full items-center justify-center text-[0.6875rem] font-semibold tracking-wider text-brass-300"
        >
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
}
