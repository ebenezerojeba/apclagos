"use client";

import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Contact form.
 *
 * Progressive and accessible by construction: real labels, `aria-invalid` and
 * `aria-describedby` on every field, errors announced through a live region,
 * and the submit button disabled only while the request is in flight (never as
 * a validation gate, which hides why a form cannot be sent).
 *
 * Anti-spam is server-side — a signed token issued with this page, a honeypot,
 * and a per-IP rate limit. Nothing here blocks a person using a keyboard or a
 * screen reader.
 */

const SUBJECTS = [
  "General enquiry",
  "Membership",
  "Media and press",
  "Local council enquiry",
  "Elections and candidates",
  "Report a correction",
] as const;

type FieldErrors = Partial<Record<string, string>>;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; detail?: string; delivered: boolean }
  | { kind: "error"; message: string };

export function ContactForm({ token }: { token: string }) {
  const formId = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus({ kind: "submitting" });
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrors(result.fieldErrors ?? {});
        setStatus({
          kind: "error",
          message: result.error ?? "The message could not be sent.",
        });
        return;
      }

      form.reset();
      setStatus({
        kind: "success",
        delivered: Boolean(result.delivered),
        detail: result.detail,
      });
    } catch {
      setStatus({
        kind: "error",
        message:
          "The message could not be sent. Please check your connection and try again.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-verdant-100 bg-verdant-50 p-8 text-center"
      >
        <span
          aria-hidden="true"
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-verdant-600 ring-1 ring-verdant-100"
        >
          <CheckCircle2 className="size-6" />
        </span>
        <h3 className="mt-5 font-display text-xl text-verdant-900">
          Thank you — your message has been received
        </h3>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-verdant-900/75">
          {status.delivered
            ? "The secretariat will route your message to the relevant office and respond as soon as possible."
            : (status.detail ??
              "Your message was received. Delivery to the secretariat inbox is not configured on this deployment yet.")}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Send another message
        </Button>
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status.kind === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-crimson-200 bg-crimson-50 p-4"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-crimson-600"
            aria-hidden="true"
          />
          <p className="text-sm text-crimson-900">{status.message}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${formId}-name`}
          name="name"
          label="Full name"
          autoComplete="name"
          required
          error={errors.name}
        />
        <Field
          id={`${formId}-email`}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          error={errors.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          label="Telephone"
          hint="Optional"
          autoComplete="tel"
          error={errors.phone}
        />
        <div>
          <label
            htmlFor={`${formId}-subject`}
            className="block text-sm font-medium text-fg"
          >
            Subject
            <span className="ml-1 text-crimson-700" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id={`${formId}-subject`}
            name="subject"
            required
            defaultValue={SUBJECTS[0]}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? `${formId}-subject-error` : undefined}
            className={cn(
              "mt-1.5 h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-fg",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200",
              errors.subject ? "border-crimson-500" : "border-border",
            )}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {errors.subject ? (
            <p id={`${formId}-subject-error`} className="mt-1.5 text-sm text-crimson-700">
              {errors.subject}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${formId}-message`}
          className="block text-sm font-medium text-fg"
        >
          Message
          <span className="ml-1 text-crimson-700" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={6}
          required
          minLength={20}
          maxLength={4000}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            errors.message ? `${formId}-message-error` : `${formId}-message-hint`
          }
          className={cn(
            "mt-1.5 w-full resize-y rounded-xl border bg-surface px-3.5 py-3 text-sm text-fg",
            "placeholder:text-fg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200",
            errors.message ? "border-crimson-500" : "border-border",
          )}
          placeholder="How can the secretariat help?"
        />
        {errors.message ? (
          <p id={`${formId}-message-error`} className="mt-1.5 text-sm text-crimson-700">
            {errors.message}
          </p>
        ) : (
          <p id={`${formId}-message-hint`} className="mt-1.5 text-xs text-fg-subtle">
            At least 20 characters. Please do not include sensitive personal
            information.
          </p>
        )}
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          iconLeft={
            submitting ? <Loader2 className="size-4 animate-spin" /> : undefined
          }
        >
          {submitting ? "Sending…" : "Send message"}
        </Button>
        <p className="text-xs text-fg-subtle">
          Fields marked <span className="text-crimson-700">*</span> are required.
        </p>
      </div>

      <p aria-live="polite" className="sr-only">
        {submitting ? "Sending your message" : ""}
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  hint,
  error,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  autoComplete?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required ? (
          <span className="ml-1 text-crimson-700" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "mt-1.5 h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-fg",
          "placeholder:text-fg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200",
          error ? "border-crimson-500" : "border-border",
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-crimson-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
