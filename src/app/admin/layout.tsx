import type { Metadata } from "next";

/**
 * The admin shell.
 *
 * Marked `#admin-shell` so `globals.css` can take the public header, footer and
 * navigation progress bar out of the layout — the App Router applies the root
 * layout to every route, so a nested layout composes inside it rather than
 * replacing it. Removing the chrome declaratively avoids restructuring thirty
 * route folders into route groups.
 */
export const metadata: Metadata = {
  title: "APC Lagos — administration",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div id="admin-shell" className="min-h-dvh bg-canvas">{children}</div>;
}
