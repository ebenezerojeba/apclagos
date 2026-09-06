import { CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small pieces every list screen repeats: the publication pill, the banner that
 * reports the result of the last action, and the empty state.
 *
 * Server components — none of this needs interactivity, and the result banner
 * is read from the query string that the action's redirect set rather than from
 * client state, which is what makes it survive the navigation.
 */

const STATUS_STYLES: Record<string, string> = {
  published: "bg-verdant-50 text-verdant-700 border-verdant-300",
  draft: "bg-paper-200 text-fg-muted border-border",
  archived: "bg-brass-100 text-brass-600 border-brass-200",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider",
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
      )}
    >
      {status}
    </span>
  );
}

/**
 * Reports what the last action did.
 *
 * Every write redirects with `?saved=`, `?deleted=` or `?error=`, so the
 * message survives a full navigation and a page refresh does not replay a
 * mutation. `role="status"` rather than `role="alert"` for the success case:
 * it is confirmation, not an interruption.
 */
export function AdminNotice({
  params,
  noun,
}: {
  params: Record<string, string | string[] | undefined>;
  noun: string;
}) {
  const saved = typeof params.saved === "string" ? params.saved : undefined;
  const deleted = params.deleted === "1";
  const error = typeof params.error === "string" ? params.error : undefined;

  if (error) {
    return (
      <div
        role="alert"
        className="mb-6 flex items-start gap-3 rounded-xl border border-crimson-200 bg-crimson-50 p-4"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-crimson-600" aria-hidden="true" />
        <p className="text-sm text-crimson-900">{error}</p>
      </div>
    );
  }

  if (saved || deleted) {
    return (
      <div
        role="status"
        className="mb-6 flex items-start gap-3 rounded-xl border border-verdant-300 bg-verdant-50 p-4"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verdant-600" aria-hidden="true" />
        <p className="text-sm text-verdant-900">
          {deleted ? (
            <>The {noun} was deleted.</>
          ) : saved === "1" ? (
            <>Saved.</>
          ) : (
            <>
              Saved <strong className="font-medium">{saved}</strong>.
            </>
          )}
        </p>
      </div>
    );
  }

  return null;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <h2 className="font-display text-lg text-fg">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
