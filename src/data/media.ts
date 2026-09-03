import type { GalleryAlbum, Video } from "@/types/content";

/**
 * PHOTO GALLERY — ships empty on purpose.
 *
 * Drop album images into `public/images/gallery/<album-slug>/` and register the
 * album here. Landscape images should be 1600x1067 or larger; the masonry grid
 * uses each image's intrinsic ratio, so supply real `width`/`height` values to
 * avoid layout shift.
 *
 * WORKED EXAMPLE:
 *
 *   {
 *     id: "g-0001",
 *     slug: "state-congress",
 *     status: "published",
 *     title: "Album title",
 *     description: "One or two sentences about the album.",
 *     category: "congress",
 *     date: "2026-02-20",
 *     location: "Ikeja, Lagos",
 *     cover: { src: "/images/gallery/state-congress/01.jpg", alt: "…",
 *              width: 1600, height: 1067, role: "gallery" },
 *     images: [
 *       { src: "/images/gallery/state-congress/01.jpg", alt: "…",
 *         width: 1600, height: 1067, caption: "Optional caption" },
 *     ],
 *   }
 */
export const galleryAlbums: GalleryAlbum[] = [];

/**
 * VIDEO LIBRARY — ships empty on purpose.
 *
 * YouTube entries need only the video id; the poster image and the privacy-
 * enhanced embed URL are derived, and the iframe is only mounted after the
 * viewer presses play so no third-party script loads on page view.
 *
 * WORKED EXAMPLE:
 *
 *   {
 *     id: "v-0001",
 *     slug: "state-chairman-address",
 *     status: "published",
 *     title: "Video title",
 *     description: "What the recording covers.",
 *     category: "speeches",
 *     publishedAt: "2026-02-22",
 *     featured: true,
 *     embed: { provider: "youtube", ref: "YOUTUBE_VIDEO_ID", duration: "12:04" },
 *   }
 */
export const videos: Video[] = [];
