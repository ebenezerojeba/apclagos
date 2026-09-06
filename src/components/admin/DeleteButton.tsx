"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";

/**
 * Deletion, behind a deliberate second step.
 *
 * The first click swaps the control for an explicit confirm/cancel pair rather
 * than opening `window.confirm`. A native dialog is trivial to dismiss by
 * reflex, cannot say what is about to be destroyed, and is suppressed outright
 * in some embedded browsers — which would turn a guarded action into a silent
 * one-click delete.
 *
 * The whole thing is a real form posting to a server action, so it works
 * without JavaScript and the server re-checks the `delete` capability
 * regardless of what the browser sends.
 */
export function DeleteButton({
  action,
  id,
  extra,
  label = "Delete",
  describe,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  /** Additional hidden fields, e.g. the kind a person belongs to. */
  extra?: Record<string, string | undefined>;
  label?: string;
  /** Named in the confirmation, so it is clear what is being removed. */
  describe: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-crimson-300 hover:text-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <span role="alert" className="text-[0.8125rem] text-fg-muted">
        Delete <strong className="font-medium text-fg">{describe}</strong> permanently?
      </span>
      <ConfirmButton />
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
      >
        Cancel
      </button>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-crimson-700 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-crimson-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-600 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Deleting…
        </>
      ) : (
        "Yes, delete"
      )}
    </button>
  );
}
