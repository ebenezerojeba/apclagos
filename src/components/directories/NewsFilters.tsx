"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FilterChips, SearchInput } from "@/components/ui/controls";
import { useDebouncedValue } from "@/hooks";
import type { NewsCategory } from "@/types/content";

/**
 * Newsroom filters.
 *
 * These write to the URL rather than to component state, so every filtered view
 * is a real, shareable, crawlable address (`/news?category=press-releases&q=…`)
 * and the results themselves stay server-rendered.
 */
export function NewsFilters({
  categories,
  counts,
  total,
}: {
  categories: NewsCategory[];
  counts: Record<string, number>;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(query, 320);

  // Keep the input in step when the visitor navigates back or clears filters.
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) params.set("q", debouncedQuery);
    else params.delete("q");
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    // `searchParams` is intentionally excluded: it changes as a result of this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, urlQuery, pathname, router]);

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      data-pending={isPending ? "" : undefined}
    >
      <div>
        <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
          Search the newsroom
        </span>
        <SearchInput
          value={query}
          onChange={setQuery}
          label="Search news by headline, summary or tag"
          placeholder="Search headlines…"
        />
      </div>

      <div className="mt-5 border-t border-border-subtle pt-5">
        <FilterChips
          label="Filter by category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "", label: "All categories", count: total },
            ...categories
              .filter((c) => (counts[c.slug] ?? 0) > 0)
              .map((c) => ({
                value: c.slug,
                label: c.name,
                count: counts[c.slug],
              })),
          ]}
        />
      </div>
    </div>
  );
}
