import type { Metadata, Viewport } from "next";
import { Inter_Tight, Newsreader } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/ui/primitives";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/data/site";
import "./globals.css";

/**
 * Typography: a transitional serif for headlines — editorial, institutional,
 * and distinct from the geometric sans every other site uses — paired with a
 * tightly-set grotesque for interface text and data.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.legalName}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  category: "Politics",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.legalName}`,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.ogImage}?title=${encodeURIComponent(siteConfig.name)}`,
        width: 1200,
        height: 630,
        alt: siteConfig.legalName,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon.ico", type: "image" }] },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#060f1e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-NG"
      className={`${newsreader.variable} ${interTight.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <SiteChrome />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
