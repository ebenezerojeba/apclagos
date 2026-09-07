"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Triage controls for one message.
 *
 * Three plain submit buttons rather than a `<select>` that submits on change:
 * changing a status is a decision, and a select fires on keyboard arrow keys,
 * so someone tabbing through the inbox would silently reclassify messages they
 * were only trying to scroll past.
 *
 * Each button is its own form so `useFormStatus` reports on the one that was
 * pressed instead of dimming all three.
 */

const NEXT_STATUSES = [
  { value: "read", label: "Mark read" },
  { value: "handled", label: "Mark handled" },
  { value: "spam", label: "Mark spam" },
] as const;

export function MessageStatus({
  action,
  id,
  current,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  current: string;
}) {
  return (
    <>
      {NEXT_STATUSES.filter((status) => status.value !== current).map((status) => (
        <form key={status.value} action={action} className="contents">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status.value} />
          <StatusButton label={status.label} destructive={status.value === "spam"} />
        </form>
      ))}
      {current !== "new" ? (
        <form action={action} className="contents">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="new" />
          <StatusButton label="Reopen" />
        </form>
      ) : null}
    </>
  );
}

function StatusButton({ label, destructive }: { label: string; destructive?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5",
        "text-[0.8125rem] font-medium text-fg-muted transition-colors",
        "hover:border-border-strong hover:text-fg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        destructive && "hover:border-brass-300 hover:text-brass-600",
      )}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}
