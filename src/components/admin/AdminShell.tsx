import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Wordmark } from "@/components/layout/Brand";
import { AdminNav } from "@/components/admin/AdminNav";
import type { AdminSession } from "@/lib/server/auth";

/**
 * The frame every admin screen sits in.
 *
 * A server component: it only needs the session, which the page has already
 * read, so there is nothing here to hydrate. Only the navigation's current-page
 * highlighting needs the pathname, and that is the one small client island.
 */

export interface Crumb {
  label: string;
  href?: string;
}

export function AdminShell({
  session,
  crumbs,
  title,
  description,
  actions,
  children,
}: {
  session: AdminSession;
  crumbs?: Crumb[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
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
        <AdminNav />
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {crumbs && crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-fg-muted">
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? (
                    <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden="true" />
                  ) : null}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="rounded transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-fg">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-display-md text-fg">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

/** A filled call-to-action styled as a link, for "New …" buttons. */
export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
    >
      {children}
    </Link>
  );
}
