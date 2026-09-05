import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/server/auth";
import { isDatabaseConfigured, safeRead } from "@/lib/server/db";
import { isCloudinaryConfigured } from "@/lib/server/cloudinary";
import { Article, EventModel, Media, Person } from "@/lib/server/models";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Wordmark } from "@/components/layout/Brand";

export const metadata: Metadata = {
  title: "Dashboard — APC Lagos administration",
  robots: { index: false, follow: false },
};

/** Reads the session and live counts, so it can never be cached. */
export const dynamic = "force-dynamic";

/**
 * What an administrator manages.
 *
 * `ready: false` marks a collection whose model, validation and read path are
 * in place but whose editing screen has not been built yet. It is rendered as a
 * disabled tile rather than a link — a dashboard that navigates to a 404 is
 * worse than one that says plainly what is not finished.
 */
const COLLECTIONS: {
  href: string;
  label: string;
  hint: string;
  ready: boolean;
}[] = [
  { href: "/admin/people", label: "People", hint: "Leadership, chairmen, representatives and candidates", ready: false },
  { href: "/admin/articles", label: "News & announcements", hint: "Articles, announcements and press releases", ready: false },
  { href: "/admin/events", label: "Events", hint: "Congresses, rallies, meetings and town halls", ready: false },
  { href: "/admin/pages", label: "Pages", hint: "Institutional pages", ready: false },
  { href: "/admin/categories", label: "Categories", hint: "Newsroom taxonomy", ready: false },
  { href: "/admin/media", label: "Media library", hint: "Uploaded images", ready: false },
  { href: "/admin/settings", label: "Site settings", hint: "Contact details and social channels", ready: false },
];

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [people, articles, events, media] = await Promise.all([
    safeRead(() => Person.countDocuments({}), 0, "count people"),
    safeRead(() => Article.countDocuments({}), 0, "count articles"),
    safeRead(() => EventModel.countDocuments({}), 0, "count events"),
    safeRead(() => Media.countDocuments({}), 0, "count media"),
  ]);

  const warnings: string[] = [];
  if (!isDatabaseConfigured()) warnings.push("MONGODB_URI is not set — nothing can be saved.");
  if (!isCloudinaryConfigured()) warnings.push("Cloudinary is not configured — image upload is unavailable.");

  const stats = [
    { label: "People", value: people },
    { label: "Articles", value: articles },
    { label: "Events", value: events },
    { label: "Media assets", value: media },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/admin" className="rounded-md">
            <Wordmark size="sm" />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-fg-muted">
              {session.name}
              <span className="ml-2 rounded-full bg-paper-200 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-fg-muted">
                {session.role}
              </span>
            </span>
            <Link
              href="/"
              className="rounded-full border border-border px-3.5 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-display-md text-fg">Dashboard</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Content published here appears on the public site immediately. No
          deployment is required.
        </p>

        {warnings.length > 0 ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-brass-200 bg-brass-100/60 p-4"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brass-600" aria-hidden="true" />
            <ul className="space-y-1 text-sm text-fg-muted">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface p-5 outline outline-border -outline-offset-[0.5px]"
            >
              <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                {stat.label}
              </dt>
              <dd className="tnum mt-2 font-display text-3xl text-fg">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-12 font-display text-xl text-fg">Manage</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection) => {
            const body = (
              <>
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-base text-fg">
                    {collection.label}
                  </span>
                  {!collection.ready ? (
                    <span className="shrink-0 rounded-full bg-paper-200 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-fg-muted">
                      Not built
                    </span>
                  ) : null}
                </span>
                <span className="mt-1.5 text-[0.8125rem] leading-relaxed text-fg-muted">
                  {collection.hint}
                </span>
              </>
            );

            return (
              <li key={collection.href}>
                {collection.ready ? (
                  <Link
                    href={collection.href}
                    className="flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-5 transition-colors hover:border-border-strong hover:bg-paper-100"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="flex h-full cursor-not-allowed flex-col rounded-xl border border-dashed border-border bg-paper-100/50 p-5"
                  >
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-6 max-w-2xl text-[0.8125rem] leading-relaxed text-fg-muted">
          Collections marked <strong className="font-medium text-fg">Not built</strong>{" "}
          have their database model, validation, indexes and public read path in
          place — the editing screens are the remaining work.
        </p>
      </main>
    </div>
  );
}
