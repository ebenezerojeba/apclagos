import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * One strict policy for the whole site: same-origin scripts and network calls,
 * with a short allow-list of video hosts for embeds.
 *
 * Media is delivered from Cloudinary over https, which `img-src https:` already
 * covers, and uploads go from the browser straight to `api.cloudinary.com` —
 * hence the one `connect-src` entry below. Nothing else is granted.
 */
const isDev = process.env.NODE_ENV === "development";

const baseCsp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "media-src": ["'self'", "https:"],
  "font-src": ["'self'", "data:"],
  "frame-src": [
    "'self'",
    "https://www.youtube-nocookie.com",
    "https://www.youtube.com",
    "https://player.vimeo.com",
    "https://www.google.com",
  ],
  // Direct-to-Cloudinary uploads from the admin. The file never passes through
  // this server, so the browser must be allowed to reach Cloudinary itself.
  "connect-src": [
    "'self'",
    "https://api.cloudinary.com",
    ...(isDev ? ["ws:", "wss:"] : []),
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

function serialiseCsp(directives: Record<string, string[]>) {
  const body = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
  return `${body}; upgrade-insecure-requests`;
}

const csp = serialiseCsp(baseCsp);

/** Applied to every response. */
const sharedSecurityHeaders = [
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
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

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
      // Cloudinary is the media store; every uploaded asset is delivered here.
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          ...sharedSecurityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
