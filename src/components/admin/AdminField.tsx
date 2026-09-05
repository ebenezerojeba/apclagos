import { cn } from "@/lib/utils";

/**
 * The one form control the admin uses.
 *
 * Every requirement the brief lists is handled here once rather than per form:
 * a real `<label>` bound by `htmlFor` (a placeholder is never the only label),
 * `aria-invalid` and `aria-describedby` wired to the message, a visible focus
 * ring, and readable input text — `text-fg` on `bg-surface`, never inheriting a
 * colour from a parent that might be dark.
 *
 * The error message is rendered in place of the hint rather than beside it, so
 * the control never changes height when validation fails and the layout does
 * not jump under the pointer.
 */

type BaseProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

const CONTROL = cn(
  "mt-1.5 w-full rounded-xl border bg-surface px-3.5 text-sm text-fg",
  "placeholder:text-fg-subtle",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200 focus-visible:border-ink-500",
  "disabled:cursor-not-allowed disabled:bg-paper-100 disabled:text-fg-subtle",
);

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
      {children}
      {required ? (
        <span className="ml-1 text-crimson-700" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

function Message({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  if (error) {
    return (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-crimson-700">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-fg-muted">
        {hint}
      </p>
    );
  }
  return null;
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/* -------------------------------------------------------------------------- */

export function AdminField({
  id,
  name,
  label,
  hint,
  error,
  required,
  className,
  type = "text",
  ...rest
}: BaseProps &
  Omit<React.ComponentPropsWithoutRef<"input">, "id" | "name" | "className">) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        {...rest}
        id={id}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(CONTROL, "h-11", error ? "border-crimson-500" : "border-border")}
      />
      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export function AdminTextarea({
  id,
  name,
  label,
  hint,
  error,
  required,
  className,
  rows = 5,
  ...rest
}: BaseProps &
  Omit<React.ComponentPropsWithoutRef<"textarea">, "id" | "name" | "className">) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        {...rest}
        id={id}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          CONTROL,
          "resize-y py-3 leading-relaxed",
          error ? "border-crimson-500" : "border-border",
        )}
      />
      <Message id={id} error={error} hint={hint} />
    </div>
  );
}

export function AdminSelect({
  id,
  name,
  label,
  hint,
  error,
  required,
  className,
  options,
  placeholder,
  ...rest
}: BaseProps & {
  options: { value: string; label: string }[];
  placeholder?: string;
} & Omit<
    React.ComponentPropsWithoutRef<"select">,
    "id" | "name" | "className" | "children"
  >) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        {...rest}
        id={id}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(CONTROL, "h-11", error ? "border-crimson-500" : "border-border")}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          // Options inherit the system menu's colours in most browsers; the
          // explicit pair guarantees readable text where a dark theme would
          // otherwise render dark-on-dark.
          <option key={option.value} value={option.value} className="bg-surface text-fg">
            {option.label}
          </option>
        ))}
      </select>
      <Message id={id} error={error} hint={hint} />
    </div>
  );
}
