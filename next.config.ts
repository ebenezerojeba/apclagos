import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * The CSP is intentionally strict; `unsafe-inline`/`unsafe-eval` for scripts are
 * only enabled in development because the Next.js dev overlay requires them.
 */
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://www.google.com",
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // The CMS reader loads JSON from `content/` at request time on the routes
  // that are not prerendered. Vercel traces imports, not runtime file reads, so
  // the directory has to be declared or those routes 404 their own content.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },

  async redirects() {
    return [
      // One door to the editor. `/admin` is what people type.
      { source: "/admin", destination: "/keystatic", permanent: false },
    ];
  },
  // NOTE: `output: "standalone"` is deliberately NOT set.
  //
  // It targets self-hosting (Docker, a bare Node server) and it does two
  // unhelpful things here: Vercel already does its own output-file tracing, so
  // it saves nothing on the configured target, and it breaks `npm start` —
  // `next start` refuses to run against a standalone build, which is the
  // documented way to check a production build locally.
  //
  // If this ever moves off Vercel, re-add it AND change the start script to
  // `node .next/standalone/server.js`, remembering that standalone does not
  // copy `public/` or `.next/static` — those have to be placed alongside the
  // server manually or the images and CSS will 404.

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1440, 1920, 2560],
    imageSizes: [64, 96, 128, 192, 256, 384, 512],
    remotePatterns: [
      // Add your CDN / media host here when images move off the filesystem.
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
