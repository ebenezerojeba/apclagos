import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/site";

/**
 * Open Graph card generator.
 *
 * Renders a 1200x630 social card in the site's own identity, so a link shared to
 * X, Facebook, LinkedIn or WhatsApp arrives looking like the platform rather
 * than as a bare URL. Titles come in through the query string and are clamped,
 * so a long headline cannot break the layout.
 *
 * Consumed via `buildMetadata()`, which points every page's `og:image` here.
 */

export const runtime = "edge";

const MAX_TITLE = 110;
const MAX_EYEBROW = 48;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTitle = searchParams.get("title")?.trim();
  const title = (rawTitle && rawTitle.length > 0 ? rawTitle : siteConfig.name).slice(
    0,
    MAX_TITLE,
  );
  const eyebrow = (searchParams.get("eyebrow")?.trim() || siteConfig.legalName).slice(
    0,
    MAX_EYEBROW,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(140deg, #0d1b31 0%, #060f1e 60%, #142642 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brass rule with the crimson seed */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 7 }}>
            <div
              style={{
                width: 7,
                height: 44,
                background: "#ffffff",
                transform: "skewX(-16deg)",
              }}
            />
            <div
              style={{
                width: 7,
                height: 44,
                background: "#e26f76",
                transform: "skewX(-16deg)",
              }}
            />
            <div
              style={{
                width: 7,
                height: 44,
                background: "#86c9a5",
                transform: "skewX(-16deg)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 21,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#d8bd80",
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 62 ? 64 : 82,
            lineHeight: 1.06,
            letterSpacing: -1.5,
            fontWeight: 600,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: 28,
            fontSize: 24,
            color: "#93aecb",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700, color: "#ffffff" }}>
            APC Lagos
          </div>
          <div style={{ display: "flex" }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, immutable",
      },
    },
  );
}
