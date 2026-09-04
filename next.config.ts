import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Two policies, because the public site and the content editor need different
 * things and the strict one must not be loosened for everybody.
 *
 * The public policy is deliberately tight: same-origin only for scripts and
 * network calls, with a short allow-list of video hosts for embeds.
 *
 * The editor policy exists because Keystatic is a browser application that
 * talks directly to GitHub. Under the public policy its calls to
 * `api.github.com` are blocked by `connect-src 'self'`, and it renders an empty
 * shell — signed in, but unable to fetch a single collection. It also pulls its
 * typeface from Google Fonts, which `style-src`/`font-src` refuse. The extra
 * origins below are exactly those it needs and nothing more, and they apply
 * only to `/keystatic` and its API.
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
  "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

/** What the editor additionally needs to reach. */
const editorCsp = {
  ...baseCsp,
  // The GitHub REST and GraphQL APIs, which is how Keystatic reads the repo,
  // lists collections and identifies the signed-in user.
  "connect-src": [...baseCsp["connect-src"], "https://api.github.com", "https://github.com"],
  // Keystatic's interface typeface.
  "style-src": [...baseCsp["style-src"], "https://fonts.googleapis.com"],
  "font-src": [...baseCsp["font-src"], "https://fonts.gstatic.com"],
  // Avatars and repository imagery come from GitHub's CDNs (https: already allows these).
  // The OAuth handshake posts to GitHub.
  "form-action": [...baseCsp["form-action"], "https://github.com"],
};

function serialiseCsp(directives: Record<string, string[]>) {
  const body = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
  return `${body}; upgrade-insecure-requests`;
}

const csp = serialiseCsp(baseCsp);
const cspEditor = serialiseCsp(editorCsp);

/** Applied to every response; the CSP is swapped per route below. */
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
    // Order matters: Next applies the first matching entry's headers, then
    // later ones, and a duplicated CSP header is enforced as the intersection
    // of both. The editor routes are therefore excluded from the public rule
    // rather than layered on top of it.
    return [
      {
        source: "/keystatic/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspEditor },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        source: "/api/keystatic/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspEditor },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        // Everything else: the strict public policy.
        source: "/((?!keystatic|api/keystatic).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          ...sharedSecurityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
