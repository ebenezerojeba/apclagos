import type { Metadata } from "next";

/**
 * The admin renders its own complete document.
 *
 * Keystatic ships a full application shell, so this segment deliberately does
 * not inherit the site chrome — a public header, footer and navigation progress
 * bar around an editing interface would be noise, and the site's global styles
 * would fight Keystatic's own.
 */
export const metadata: Metadata = {
  title: "APC Lagos — content admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
