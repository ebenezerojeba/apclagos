import { FileQuestion, Inbox, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Empty, loading and error states.
 *
 * Because much of this platform is a directory that fills up over time, the
 * empty state is a first-class screen rather than an afterthought: it says what
 * will appear here, and offers the nearest useful action.
 */

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  tone = "light",
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center sm:py-20",
        dark
          ? "border-white/15 bg-white/[0.03]"
          : "border-border bg-paper-100/60",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mb-5 flex size-12 items-center justify-center rounded-full",
          dark ? "bg-white/10 text-brass-300" : "bg-surface text-ink-400 ring-1 ring-border-subtle",
        )}
      >
        {icon ?? <Inbox className="size-5" />}
      </span>
      <h3
        className={cn(
          "font-display text-xl leading-snug",
          dark ? "text-white" : "text-fg",
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-2.5 max-w-md text-sm leading-relaxed",
            dark ? "text-ink-300" : "text-fg-muted",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/**
 * The specific empty state used across directories while the party is still
 * loading its records. It names the file an administrator needs to edit.
 */
export function AwaitingRecordsState({
  what,
  dataFile,
  className,
  tone = "light",
  variant = "panel",
}: {
  what: string;
  dataFile: string;
  className?: string;
  tone?: "light" | "dark";
  /**
   * `panel` is the full screen used on a dedicated page. `compact` is a single
   * strip, used where several sections of a page are still awaiting records —
   * five stacked panels would say the same thing five times.
   */
  variant?: "panel" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-start gap-3.5 rounded-xl border border-dashed border-border bg-paper-100/60 px-5 py-4",
          className,
        )}
      >
        <FileQuestion
          className="mt-0.5 size-4 shrink-0 text-fg-subtle"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-fg-muted">
          <span className="font-medium text-fg">
            {what} have not been published yet.
          </span>{" "}
          Nothing here is generated or estimated — they appear as soon as the
          party&rsquo;s records are added to{" "}
          <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
            {dataFile}
          </code>
          .
        </p>
      </div>
    );
  }

  return (
    <EmptyState
      tone={tone}
      className={className}
      icon={<FileQuestion className="size-5" />}
      title={`${what} will be published here`}
      description={
        <>
          No records have been published yet. Nothing on this platform is
          generated or estimated — {what.toLowerCase()} appear as soon as the
          party&rsquo;s authoritative records are added to{" "}
          <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
            {dataFile}
          </code>
          .
        </>
      }
    />
  );
}

export function NoResultsState({
  query,
  onReset,
  className,
}: {
  query?: string;
  onReset?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      icon={<FileQuestion className="size-5" />}
      title={query ? `No matches for “${query}”` : "No matches"}
      description="Try a different spelling, a shorter term, or clear the filters to see everything."
      action={onReset}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "The page could not be loaded. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-crimson-200 bg-crimson-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-5 flex size-12 items-center justify-center rounded-full bg-white text-crimson-600 ring-1 ring-crimson-200"
      >
        <TriangleAlert className="size-5" />
      </span>
      <h2 className="font-display text-xl text-crimson-900">{title}</h2>
      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-crimson-800/80">
        {description}
      </p>
      {onRetry ? <div className="mt-6">{onRetry}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading                                                                    */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <Skeleton className="aspect-3/4 rounded-none" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function GridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-page py-16">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-6 h-12 w-full max-w-xl" />
      <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-4 w-3/4 max-w-xl" />
      <GridSkeleton className="mt-14" />
    </div>
  );
}

/** Shared 404-style block for a record that does not exist. */
export function NotFoundState({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="container-page py-24 text-center sm:py-32">
      <p className="eyebrow justify-center text-crimson-700">
        <span aria-hidden="true" className="h-px w-6 bg-crimson-400" />
        Not found
      </p>
      <h1 className="mt-4 text-display-lg">{title}</h1>
      <p className="mx-auto mt-4 max-w-lg text-fg-muted">{description}</p>
      <div className="mt-8 flex justify-center">
        <Button href={backHref} variant="outline">
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
