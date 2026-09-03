import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small, shared building blocks. Everything here is a server component so it
 * costs nothing on the client.
 */

/* -------------------------------------------------------------------------- */
/*  Badge                                                                      */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "neutral"
  | "ink"
  | "crimson"
  | "verdant"
  | "brass"
  | "outline"
  | "inverse";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-paper-200 text-fg-muted",
  ink: "bg-ink-900 text-white",
  crimson: "bg-crimson-50 text-crimson-800 ring-1 ring-crimson-200",
  verdant: "bg-verdant-50 text-verdant-700 ring-1 ring-verdant-100",
  brass: "bg-brass-100 text-brass-600 ring-1 ring-brass-200",
  outline: "bg-transparent text-fg-muted ring-1 ring-border",
  inverse: "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.09em]",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section header                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  tone = "light",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "md:max-w-3xl")}>
        {eyebrow ? (
          <p className={cn("eyebrow", dark && "text-brass-300")}>
            <span
              aria-hidden="true"
              className={cn(
                "h-px w-6",
                dark ? "bg-brass-400/70" : "bg-brass-400",
              )}
            />
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className={cn(
            "mt-3 text-display-lg leading-[1.08]",
            dark ? "text-white" : "text-fg",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <div
            className={cn(
              "mt-4 text-base leading-relaxed md:text-[1.0625rem]",
              dark ? "text-ink-200" : "text-fg-muted",
            )}
          >
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Breadcrumbs                                                                */
/* -------------------------------------------------------------------------- */

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({
  items,
  tone = "light",
  className,
}: {
  items: Crumb[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight
                  className={cn(
                    "size-3.5 shrink-0",
                    dark ? "text-ink-400" : "text-paper-500",
                  )}
                  aria-hidden="true"
                />
              ) : null}
              {isLast ? (
                <span
                  aria-current="page"
                  className={cn(
                    "font-medium",
                    dark ? "text-white" : "text-fg",
                  )}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-sm underline-offset-4 transition-colors hover:underline",
                    dark
                      ? "text-ink-200 hover:text-white"
                      : "text-fg-subtle hover:text-ink-800",
                  )}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card shell                                                                 */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  interactive = false,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "li";
}) {
  return (
    <As
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        interactive &&
          "group/card transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)] focus-within:border-ink-500",
        !interactive && "shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </As>
  );
}

/**
 * Turns an entire card into one click target while keeping a single, real link
 * in the accessibility tree. Place inside a `relative` card; the anchor covers
 * the card via a pseudo-element.
 */
export function CardLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  /** Omit to make the whole card clickable with only an accessible label. */
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "after:absolute after:inset-0 after:z-10 after:content-['']",
        "rounded-sm outline-offset-4",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Definition list                                                            */
/* -------------------------------------------------------------------------- */

export function DataList({
  items,
  className,
  tone = "light",
}: {
  items: { label: string; value: ReactNode; note?: string }[];
  className?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <dl className={cn("divide-y", dark ? "divide-white/10" : "divide-border-subtle", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-6"
        >
          <dt
            className={cn(
              "text-[0.8125rem] font-medium",
              dark ? "text-ink-300" : "text-fg-subtle",
            )}
          >
            {item.label}
          </dt>
          <dd className={cn("text-[0.9375rem]", dark ? "text-white" : "text-fg")}>
            {item.value}
            {item.note ? (
              <span
                className={cn(
                  "mt-0.5 block text-xs",
                  dark ? "text-ink-400" : "text-fg-subtle",
                )}
              >
                {item.note}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline link with arrow                                                     */
/* -------------------------------------------------------------------------- */

export function ArrowLink({
  href,
  children,
  tone = "light",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/arrow inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight",
        tone === "dark"
          ? "text-brass-300 hover:text-brass-200"
          : "text-ink-800 hover:text-crimson-700",
        className,
      )}
    >
      {children}
      <ChevronRight
        className="size-4 transition-transform duration-300 group-hover/arrow:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Structured data                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Emits a JSON-LD block. The payload is serialised with `<` escaped so a stray
 * angle bracket in content can never break out of the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data, (_key, value) =>
    value === undefined ? undefined : value,
  ).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
