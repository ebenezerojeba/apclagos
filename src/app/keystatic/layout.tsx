import type { Metadata } from "next";

/**
 * The content editor's shell.
 *
 * A correction worth recording: this file previously claimed the segment "does
 * not inherit the site chrome". That was wrong. In the App Router
 * `app/layout.tsx` is the root layout and always wraps every route — a nested
 * `layout.tsx` composes *inside* it, it does not replace it. The editor was
 * therefore rendering between the public header and footer, which is exactly
 * what it looked like in production.
 *
 * The textbook fix is two root layouts behind route groups (`(site)` and
 * `(admin)`). That was attempted and reverted: on Windows the directories
 * holding dynamic `[slug]` segments could not be moved while an editor held
 * file handles on them, and a half-completed move of thirty route folders is a
 * far worse outcome than the cosmetic problem it solves.
 *
 * So the chrome is removed declaratively instead. `#admin-shell` marks this
 * subtree, and `globals.css` uses `:has()` to take the header, footer and
 * navigation progress bar out of the layout whenever it is present. Where
 * `:has()` is unsupported the shell still claims the full viewport, so the
 * editor is usable either way.
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
  return <div id="admin-shell">{children}</div>;
}
