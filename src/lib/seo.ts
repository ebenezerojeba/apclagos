import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

/**
 * SEO helpers. Every page composes its metadata through `buildMetadata` so that
 * titles, canonicals, Open Graph and Twitter cards stay consistent and nothing
 * is forgotten on a new route.
 */

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The generated social card for a page. Used whenever a page has no artwork of
 * its own, so every shared link still arrives branded rather than blank.
 */
export function generatedOgImage(title: string, eyebrow?: string): string {
  const params = new URLSearchParams({ title });
  if (eyebrow) params.set("eyebrow", eyebrow);
  return `/api/og?${params.toString()}`;
}

export interface PageMetaInput {
  title: string;
  description: string;
  /** Site-relative path, used for the canonical URL and OG url. */
  path: string;
  /** Absolute or site-relative image. Falls back to the site OG image. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
  /** Set on thin or duplicate listing views (e.g. deep pagination). */
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noIndex,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  // A page's own artwork wins; otherwise fall back to a generated card.
  const ogImage = absoluteUrl(image ?? generatedOgImage(title));

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: type === "profile" ? "profile" : type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title,
        },
      ],
      ...(type === "article"
        ? { publishedTime, modifiedTime, authors }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Structured data                                                            */
/* -------------------------------------------------------------------------- */

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "PoliticalParty",
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/images/logos/apc-logo.png"),
    foundingDate: siteConfig.founded,
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Lagos State",
      containedInPlace: { "@type": "Country", name: "Nigeria" },
    },
  };
}

export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; href: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

export function personJsonLd(input: {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  path: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    jobTitle: input.jobTitle,
    description: input.description,
    image: input.image ? absoluteUrl(input.image) : undefined,
    url: absoluteUrl(input.path),
    affiliation: {
      "@type": "PoliticalParty",
      name: siteConfig.legalName,
      url: siteConfig.url,
    },
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
  authorName?: string;
  section?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    image: input.image ? [absoluteUrl(input.image)] : undefined,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    articleSection: input.section,
    author: {
      "@type": "Organization",
      name: input.authorName ?? siteConfig.legalName,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.legalName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/logos/apc-logo.png"),
      },
    },
  };
}

export function eventJsonLd(input: {
  name: string;
  description: string;
  path: string;
  startsAt: string;
  endsAt?: string;
  venueName?: string;
  venueAddress?: string;
  image?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    startDate: input.startsAt,
    endDate: input.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: input.image ? [absoluteUrl(input.image)] : undefined,
    location: input.venueName
      ? {
          "@type": "Place",
          name: input.venueName,
          address: input.venueAddress ?? "Lagos State, Nigeria",
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: siteConfig.legalName,
      url: siteConfig.url,
    },
  };
}

export function itemListJsonLd(input: {
  name: string;
  items: { name: string; href: string }[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}
