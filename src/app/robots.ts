import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

/**
 * robots.txt
 *
 * Public content is fully crawlable. Search result pages, the API surface and
 * the administrative area are excluded — they contain nothing a crawler should
 * index, and keeping them out avoids wasting crawl budget on duplicates.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/admin/", "/search?", "/search"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
