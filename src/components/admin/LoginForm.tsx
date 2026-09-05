"use client";

import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { AdminField } from "@/components/admin/AdminField";
import { cn } from "@/lib/utils";

/**
 * Admin sign-in.
 *
 * The whole form is a real `<form>` with real labels, so it submits on Enter
 * and reads correctly to a screen reader. Client validation exists to give a
 * fast answer, never as the gate — the server validates independently and is
 * the only thing that decides.
 *
 * `submitting` disables the button and short-circuits the handler, which is
 * what stops a double submission from a second Enter press while the first
 * request is still in flight.
 */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "Sign-in failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // `refresh()` re-runs the server components so the new session is read
      // before the navigation lands; without it the dashboard can render once
      // as signed-out and bounce straight back to this page.
      router.refresh();
      router.replace(next.startsWith("/admin") ? next : "/admin");
    } catch {
      setFormError(
        "Could not reach the server. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-crimson-200 bg-crimson-50 p-3.5"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-crimson-600"
            aria-hidden="true"
          />
          <p className="text-sm text-crimson-900">{formError}</p>
        </div>
      ) : null}

      <AdminField
        id={`${formId}-email`}
        name="email"
        label="Email address"
        type="email"
        autoComplete="username"
        required
        error={fieldErrors.email}
      />

      <AdminField
        id={`${formId}-password`}
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors.password}
      />

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-5",
          "text-sm font-semibold text-white transition-colors",
          "hover:bg-ink-800 focus-visible:outline focus-visible:outline-2",
          "focus-visible:outline-offset-2 focus-visible:outline-ink-600",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>

      {/* Announced to screen readers without stealing focus. */}
      <p aria-live="polite" className="sr-only">
        {submitting ? "Signing in" : ""}
      </p>
    </form>
  );
}
