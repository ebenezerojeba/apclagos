import type { ReactNode } from "react";
import { Breadcrumbs, JsonLd, type Crumb } from "@/components/ui/primitives";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * The masthead used by every page below the homepage.
 *
 * It carries the breadcrumb trail (visible and as structured data), the page
 * title as the single `<h1>`, and an optional aside for counts or actions.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  aside,
  tone = "ink",
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  breadcrumbs: Crumb[];
  aside?: ReactNode;
  tone?: "ink" | "light";
  children?: ReactNode;
  className?: string;
}) {
  const dark = tone === "ink";

  return (
    <header
      className={cn(
        "relative isolate overflow-hidden",
        dark ? "panel-ink" : "border-b border-border-subtle bg-surface",
        className,
      )}
    >
      {dark ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute -left-[10%] top-[-60%] size-[32rem] rounded-full bg-ink-600/25 blur-[110px]" />
          <div className="absolute right-[-8%] bottom-[-70%] size-[26rem] rounded-full bg-crimson-800/20 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(255 255 255 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.5) 1px, transparent 1px)",
              backgroundSize: "clamp(3rem, 6vw, 5rem) clamp(3rem, 6vw, 5rem)",
              maskImage: "radial-gradient(110% 90% at 30% 0%, black 5%, transparent 70%)",
            }}
          />
        </div>
      ) : null}

      <div className="container-page py-10 sm:py-14 lg:py-16">
        <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
        <Breadcrumbs items={breadcrumbs} tone={dark ? "dark" : "light"} />

        <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className={cn("eyebrow", dark && "text-brass-300")}>
                <span
                  aria-hidden="true"
                  className={cn("h-px w-6", dark ? "bg-brass-400" : "bg-brass-400")}
                />
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "mt-3 text-display-xl leading-[1.02]",
                dark ? "text-white" : "text-fg",
              )}
            >
              {title}
            </h1>
            {description ? (
              <div
                className={cn(
                  "mt-5 max-w-2xl text-base leading-relaxed sm:text-[1.0625rem]",
                  dark ? "text-ink-200" : "text-fg-muted",
                )}
              >
                {description}
              </div>
            ) : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>

        {children ? <div className="mt-9">{children}</div> : null}
      </div>
    </header>
  );
}

/** Compact key/value strip used under a page header (counts, districts, dates). */
export function HeaderFacts({
  items,
  tone = "dark",
  className,
}: {
  items: { label: string; value: ReactNode }[];
  tone?: "dark" | "light";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 border-t pt-6 sm:grid-cols-3 lg:grid-cols-4",
        dark ? "border-white/12" : "border-border-subtle",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt
            className={cn(
              "text-[0.6875rem] font-semibold uppercase tracking-[0.13em]",
              dark ? "text-brass-300" : "text-fg-subtle",
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              "tnum mt-1.5 font-display text-xl leading-tight",
              dark ? "text-white" : "text-fg",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
