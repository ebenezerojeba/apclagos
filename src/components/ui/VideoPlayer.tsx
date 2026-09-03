"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { embedUrl, youtubeThumbnail } from "@/lib/video";
import type { VideoEmbed } from "@/types/content";

/**
 * Click-to-load video embed.
 *
 * Nothing from YouTube or Vimeo is requested until the viewer presses play:
 * before that the component renders a poster and a button. That keeps the page
 * free of third-party scripts and cookies on load, and keeps the embed off the
 * critical path for Core Web Vitals. Playback uses the privacy-enhanced host.
 */
export function VideoPlayer({
  embed,
  title,
  className,
  poster,
}: {
  embed: VideoEmbed;
  title: string;
  className?: string;
  poster?: string;
}) {
  const [playing, setPlaying] = useState(false);

  const posterSrc =
    poster ??
    embed.poster?.src ??
    (embed.provider === "youtube" ? youtubeThumbnail(embed.ref) : undefined);

  if (embed.provider === "file" && playing) {
    return (
      <div className={cn("relative aspect-video overflow-hidden rounded-2xl bg-ink-950", className)}>
        <video
          src={embed.ref}
          controls
          autoPlay
          playsInline
          poster={posterSrc}
          className="size-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-2xl bg-ink-950",
        className,
      )}
    >
      {playing ? (
        <iframe
          src={embedUrl(embed)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 size-full"
        >
          {posterSrc ? (
            <Image
              src={posterSrc}
              alt=""
              fill
              sizes="(min-width: 1024px) 60rem, 100vw"
              className="object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-95"
            />
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-ink-800),var(--color-ink-950))]"
            />
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white/92 text-ink-900 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.8)] transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-0.5 size-7 fill-current" />
            </span>
          </span>
          {embed.duration ? (
            <span className="tnum absolute bottom-3 right-3 rounded-md bg-ink-950/80 px-2 py-0.5 text-xs font-medium text-white">
              {embed.duration}
            </span>
          ) : null}
          <span className="sr-only">Play video: {title}</span>
        </button>
      )}
    </div>
  );
}
