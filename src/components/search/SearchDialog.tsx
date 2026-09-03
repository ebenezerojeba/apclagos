"use client";

import { useRouter } from "next/navigation";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useDebouncedValue } from "@/hooks";
import { cn } from "@/lib/utils";
import type { SearchEntityType } from "@/types/content";

interface SearchHit {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_LABEL: Record<SearchEntityType, string> = {
  page: "Page",
  person: "Person",
  candidate: "Candidate",
  lga: "LGA",
  lcda: "LCDA",
  ward: "Ward",
  constituency: "Constituency",
  news: "News",
  event: "Event",
  gallery: "Album",
  video: "Video",
  document: "Document",
};

/**
 * Global search palette.
 *
 * Combobox semantics: the input owns `aria-activedescendant`, the list is a
 * `listbox`, and arrow keys move a virtual cursor without ever moving DOM focus
 * away from the input. Enter opens the highlighted result; Enter with nothing
 * highlighted runs a full search.
 */
export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const debounced = useDebouncedValue(query, 180);

  useEffect(() => {
    if (open) {
      setActive(0);
      // Wait for the dialog transition before taking focus.
      const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
    setQuery("");
    setHits([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = debounced.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(term)}&limit=12`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data: { results?: SearchHit[] }) => {
        setHits(data.results ?? []);
        setActive(0);
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== "AbortError") setHits([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced, open]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (hits.length ? (i + 1) % hits.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit) go(hit.href);
      else if (query.trim().length >= 2)
        go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      align="top"
      label="Search APC Lagos"
      panelClassName="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-overlay)]"
    >
      <div className="flex items-center gap-3 border-b border-border-subtle px-5">
        <Search className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
          aria-label="Search people, councils, constituencies, news and events"
          placeholder="Search people, councils, constituencies, news…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          className="h-16 w-full bg-transparent text-base text-fg placeholder:text-fg-subtle focus:outline-none"
        />
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-fg-subtle" aria-hidden="true" />
        ) : null}
      </div>

      <div className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain">
        {hits.length > 0 ? (
          <ul id={listId} role="listbox" aria-label="Search results" className="p-2">
            {hits.map((hit, index) => (
              <li key={hit.id} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onClick={() => go(hit.href)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    index === active ? "bg-paper-200" : "hover:bg-paper-100",
                  )}
                >
                  <span className="w-24 shrink-0 truncate text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    {TYPE_LABEL[hit.type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {hit.title}
                    </span>
                    {hit.subtitle ? (
                      <span className="block truncate text-[0.8125rem] text-fg-muted">
                        {hit.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {index === active ? (
                    <CornerDownLeft className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim().length >= 2 && !loading ? (
          <p className="px-6 py-10 text-center text-sm text-fg-muted">
            No matches for &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <div className="px-6 py-8">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              Try searching for
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {["Alimosho", "Lagos West", "Ikorodu North", "House of Assembly", "Election 2027"].map(
                (suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => setQuery(suggestion)}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-[0.8125rem] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                    >
                      {suggestion}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border-subtle bg-paper-100 px-5 py-3 text-[0.75rem] text-fg-subtle">
        <span className="hidden sm:inline">
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate · <Kbd>↵</Kbd> to open · <Kbd>Esc</Kbd> to close
        </span>
        <button
          type="button"
          onClick={() => {
            if (query.trim().length >= 2) go(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
          disabled={query.trim().length < 2}
          className="ml-auto font-semibold text-ink-700 transition-colors hover:text-crimson-700 disabled:opacity-40"
        >
          View all results
        </button>
      </div>
    </Modal>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-fg-muted">
      {children}
    </kbd>
  );
}
