import type { VideoEmbed } from "@/types/content";

/**
 * Video helpers.
 *
 * Embeds always use the privacy-enhanced YouTube host and are only mounted after
 * the viewer presses play (see `VideoPlayer`), so no third-party script or cookie
 * loads on page view.
 */

/** Accepts a bare id or any common YouTube URL and returns the id. */
export function youtubeId(ref: string): string {
  const trimmed = ref.trim();
  if (/^[\w-]{6,20}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{6,20})/,
  );
  return match?.[1] ?? trimmed;
}

export function youtubeThumbnail(ref: string): string {
  return `https://i.ytimg.com/vi/${youtubeId(ref)}/maxresdefault.jpg`;
}

export function embedUrl(embed: VideoEmbed): string {
  switch (embed.provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${youtubeId(
        embed.ref,
      )}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    case "vimeo":
      return `https://player.vimeo.com/video/${embed.ref.replace(
        /\D/g,
        "",
      )}?autoplay=1&dnt=1`;
    default:
      return embed.ref;
  }
}

export function watchUrl(embed: VideoEmbed): string {
  switch (embed.provider) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${youtubeId(embed.ref)}`;
    case "vimeo":
      return `https://vimeo.com/${embed.ref.replace(/\D/g, "")}`;
    default:
      return embed.ref;
  }
}
