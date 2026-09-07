"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

/**
 * Admin error boundary.
 *
 * The root boundary renders inside the public site chrome, which `globals.css`
 * removes from the admin subtree — so an admin failure would have landed on a
 * page with no header, no navigation and no way back except the browser button.
 * This one keeps the editor oriented.
 *
 * The digest is shown deliberately. It is not sensitive: Next.js generates it
 * precisely so a user can quote it and an operator can find the matching server
 * log line, which turns "it broke" into something answerable. The error message
 * itself is never rendered — in production it is a generic string, and in
 * development it can carry a connection string.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error", error.digest ?? error.name);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-crimson-200 bg-crimson-50">
          <TriangleAlert className="size-5 text-crimson-600" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-2xl text-fg">
          Something went wrong in the administration area
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          The screen could not be loaded. Any work you had already saved is
          unaffected — this failed while reading, not while writing.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-fg-subtle">
            Reference{" "}
            <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-800">
              {error.digest}
            </code>
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            Back to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
