"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AchievementCard } from "@/components/cards/ContentCards";
import { FilterChips, ResultCount, SearchInput, Select } from "@/components/ui/controls";
import { NoResultsState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import type { Achievement } from "@/types/content";

/**
 * Achievements browser with a chronological view.
 *
 * The timeline is built from the same filtered set as the cards, so switching
 * views never shows a different set of records.
 */
export function AchievementBrowser({
  achievements,
  categories,
  years,
}: {
  achievements: Achievement[];
  categories: { value: string; label: string; count: number }[];
  years: number[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return achievements.filter((item) => {
      if (category && item.category !== category) return false;
      if (year && String(item.year ?? "") !== year) return false;
      if (!needle) return true;
      return [item.title, item.summary, item.location, item.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [achievements, category, year, deferredQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    for (const item of filtered) {
      const key = item.year ? String(item.year) : "Undated";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const hasFilters = Boolean(query || category || year);

  function reset() {
    setQuery("");
    setCategory("");
    setYear("");
  }

  return (
    <div>
      <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,12rem)] lg:items-end">
          <div>
            <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
              Search
            </span>
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Search achievements by title, location or source"
              placeholder="Search projects and milestones…"
            />
          </div>
          <Select
            label="Year"
            value={year}
            onChange={setYear}
            options={years.map((y) => ({
              value: String(y),
              label: String(y),
              count: achievements.filter((a) => a.year === y).length,
            }))}
            placeholder="All years"
          />
        </div>

        {categories.length > 0 ? (
          <div className="mt-5 border-t border-border-subtle pt-5">
            <FilterChips
              label="Filter by sector"
              value={category}
              onChange={setCategory}
              options={[
                { value: "", label: "All sectors", count: achievements.length },
                ...categories,
              ]}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <ResultCount
            count={filtered.length}
            total={achievements.length}
            noun="achievement"
          />
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              Clear filters
            </Button>
          ) : null}
        </div>
        <div
          role="group"
          aria-label="Change layout"
          className="flex items-center gap-1 rounded-full border border-border bg-surface p-1"
        >
          {(["grid", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium capitalize transition-colors ${
                view === mode ? "bg-ink-900 text-white" : "text-fg-subtle hover:text-fg"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <NoResultsState
          className="mt-8"
          query={query.trim() || undefined}
          onReset={
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : view === "grid" ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.slug}>
              <AchievementCard achievement={item} />
            </li>
          ))}
        </ul>
      ) : (
        <ol className="mt-10 space-y-12">
          {grouped.map(([groupYear, items]) => (
            <li key={groupYear}>
              <div className="flex items-center gap-4">
                <h3 className="tnum font-display text-3xl text-ink-900">{groupYear}</h3>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
                <span className="tnum text-sm text-fg-subtle">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <li key={item.slug}>
                    <AchievementCard achievement={item} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
