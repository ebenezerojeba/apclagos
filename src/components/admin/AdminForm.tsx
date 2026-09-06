"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/server/admin/forms";

/**
 * The wrapper every admin form uses.
 *
 * `useActionState` keeps the server's reply — a banner message and per-field
 * errors — without turning the form into controlled state. That matters for a
 * form this size: a failed save re-renders with the errors while the browser
 * keeps everything the editor typed, because the inputs were never React-
 * controlled in the first place.
 *
 * The children are a render prop rather than plain nodes so each screen can
 * read `fieldErrors` and attach the right message to the right control.
 */

interface Props {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  children: (state: ActionState) => React.ReactNode;
  /** Rendered above the fields, e.g. a success notice from a query string. */
  notice?: React.ReactNode;
  className?: string;
}

export function AdminForm({ action, children, notice, className }: Props) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {
    ok: false,
  });

  return (
    <form action={formAction} noValidate className={cn("space-y-8", className)}>
      {notice}

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-crimson-200 bg-crimson-50 p-4"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-crimson-600"
            aria-hidden="true"
          />
          <p className="text-sm text-crimson-900">{state.error}</p>
        </div>
      ) : null}

      {children(state)}
    </form>
  );
}

/**
 * Disabled while the action is in flight, which is what prevents a second
 * submission creating a duplicate record on a slow connection.
 */
export function SubmitButton({
  children = "Save",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-6",
          "text-sm font-semibold text-white transition-colors hover:bg-ink-800",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          children
        )}
      </button>
      <p aria-live="polite" className="sr-only">
        {pending ? "Saving" : ""}
      </p>
    </>
  );
}

/** A confirmation banner, shown after a redirect carrying `?saved=`. */
export function SavedNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-verdant-300 bg-verdant-50 p-4">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verdant-600" aria-hidden="true" />
      <p className="text-sm text-verdant-900">{children}</p>
    </div>
  );
}
