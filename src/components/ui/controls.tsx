"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks";

/**
 * Form controls used by every directory on the site.
 *
 * All of them are real, labelled form elements. The custom select is a
 * `<button>` + listbox with full keyboard support rather than a styled div, and
 * the filter chips are radio/checkbox semantics expressed as buttons with
 * `aria-pressed`.
 */

/* -------------------------------------------------------------------------- */
/*  Search input                                                               */
/* -------------------------------------------------------------------------- */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label,
  className,
  autoFocus,
  id,
  size = "md",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
  size?: "md" | "lg";
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
      <input
        id={inputId}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-full border border-border bg-surface pr-11 text-fg shadow-[0_1px_2px_rgb(13_27_49/0.04)]",
          "placeholder:text-fg-subtle focus:border-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200",
          "[&::-webkit-search-cancel-button]:appearance-none",
          size === "lg" ? "h-14 pl-12 text-base" : "h-11 pl-11 text-sm",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-paper-200 hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Clear search</span>
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Select                                                                     */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = "All",
  className,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const buttonId = useId();

  useOnClickOutside(containerRef, () => setOpen(false), open);

  const items = useMemo(
    () => [{ value: "", label: placeholder }, ...options],
    [options, placeholder],
  );
  const selected = items.find((o) => o.value === value) ?? items[0];

  function commit(index: number) {
    const option = items[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <span
        id={`${buttonId}-label`}
        className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle"
      >
        {label}
      </span>
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${buttonId}-label ${buttonId}`}
        onClick={() => {
          setOpen((o) => !o);
          setActiveIndex(Math.max(0, items.findIndex((o) => o.value === value)));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            if (!open) {
              event.preventDefault();
              setOpen(true);
            }
          }
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 text-left text-sm text-fg",
          "transition-colors hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200",
          open && "border-ink-500",
        )}
      >
        <span className={cn("truncate", !value && "text-fg-muted")}>
          {selected?.label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listId}-${activeIndex}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((i) => (i + 1) % items.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => (i - 1 + items.length) % items.length);
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              commit(activeIndex);
            }
          }}
          ref={(node) => node?.focus()}
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface py-1.5 shadow-[var(--shadow-overlay)] focus:outline-none"
        >
          {items.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value || "__all"} id={`${listId}-${index}`} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => commit(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm",
                    index === activeIndex ? "bg-paper-200 text-fg" : "text-fg-muted",
                    isSelected && "font-semibold text-fg",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {typeof option.count === "number" ? (
                      <span className="tnum text-xs text-fg-subtle">{option.count}</span>
                    ) : null}
                    {isSelected ? (
                      <Check className="size-4 text-ink-700" aria-hidden="true" />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Filter chips                                                               */
/* -------------------------------------------------------------------------- */

export function FilterChips({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="sr-only">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value || "__all"}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
                active
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {option.label}
              {typeof option.count === "number" ? (
                <span
                  className={cn(
                    "tnum text-[0.6875rem]",
                    active ? "text-ink-200" : "text-fg-subtle",
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Alphabet index                                                             */
/* -------------------------------------------------------------------------- */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetIndex({
  available,
  value,
  onChange,
  className,
}: {
  available: Set<string>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Browse alphabetically"
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      <button
        type="button"
        aria-pressed={value === ""}
        onClick={() => onChange("")}
        className={cn(
          "rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
          value === ""
            ? "bg-ink-900 text-white"
            : "text-fg-muted hover:bg-paper-200 hover:text-fg",
        )}
      >
        All
      </button>
      {LETTERS.map((letter) => {
        const enabled = available.has(letter);
        const active = value === letter;
        return (
          <button
            key={letter}
            type="button"
            disabled={!enabled}
            aria-pressed={active}
            onClick={() => onChange(active ? "" : letter)}
            className={cn(
              "size-7 rounded-md text-xs font-semibold transition-colors",
              active && "bg-ink-900 text-white",
              !active && enabled && "text-fg-muted hover:bg-paper-200 hover:text-fg",
              !enabled && "cursor-not-allowed text-paper-400",
            )}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Client-side pagination                                                     */
/* -------------------------------------------------------------------------- */

export function ClientPagination({
  page,
  pageCount,
  onChange,
  className,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = pageWindow(page, pageCount);

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      <PageButton
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        label="Previous page"
      >
        Prev
      </PageButton>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-fg-subtle" aria-hidden="true">
            …
          </span>
        ) : (
          <PageButton
            key={p}
            active={p === page}
            onClick={() => onChange(p)}
            label={`Page ${p}`}
          >
            {p}
          </PageButton>
        ),
      )}
      <PageButton
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        label="Next page"
      >
        Next
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn(
        "tnum inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-ink-900 text-white"
          : "border border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
        disabled && "cursor-not-allowed opacity-40 hover:border-border hover:text-fg-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Produces `1 … 4 5 6 … 20` style page windows. */
export function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < pageCount - 1) out.push("…");
  out.push(pageCount);
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Result count                                                               */
/* -------------------------------------------------------------------------- */

export function ResultCount({
  count,
  total,
  noun,
  className,
}: {
  count: number;
  total: number;
  noun: string;
  className?: string;
}) {
  return (
    <p
      aria-live="polite"
      className={cn("tnum text-sm text-fg-muted", className)}
    >
      Showing <span className="font-semibold text-fg">{count}</span>
      {count !== total ? (
        <>
          {" "}
          of <span className="font-semibold text-fg">{total}</span>
        </>
      ) : null}{" "}
      {count === 1 ? noun : `${noun}s`}
    </p>
  );
}
