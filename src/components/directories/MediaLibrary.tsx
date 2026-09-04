"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { GalleryCard, VideoCard } from "@/components/cards/ContentCards";
import { FilterChips, ResultCount, SearchInput } from "@/components/ui/controls";
import { NoResultsState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import type { GalleryAlbum, Video } from "@/types/content";

/**
 * Shared browser for the photo gallery and the video library.
 *
 * Both collections are small enough to filter in the browser; the caller passes
 * whichever kind it holds, and the component renders the matching card. Keeping
 * one implementation means the two libraries never drift apart.
 */
export function MediaLibrary<T extends GalleryAlbum | Video>({
  items,
  categories,
  kind,
}: {
  items: T[];
  categories: { value: string; label: string; count: number }[];
  kind: "album" | "video";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (!needle) return true;
      const haystack = [
        item.title,
        item.description,
        item.category,
        "location" in item ? item.location : undefined,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, category, deferredQuery]);

  const hasFilters = Boolean(query || category);

  function reset() {
    setQuery("");
    setCategory("");
  }

  return (
    <div>
      <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div>
          <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
            Search
          </span>
          <SearchInput
            value={query}
            onChange={setQuery}
            label={kind === "album" ? "Search photo albums" : "Search videos"}
            placeholder={
              kind === "album" ? "Search albums…" : "Search videos…"
            }
          />
        </div>
        {categories.length > 0 ? (
          <div className="mt-5 border-t border-border-subtle pt-5">
            <FilterChips
              label="Filter by category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "", label: "All", count: items.length },
                ...categories,
              ]}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <ResultCount
          count={filtered.length}
          total={items.length}
          noun={kind === "album" ? "album" : "video"}
        />
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {/*
        Card titles are h3. Without a heading for the results region they would
        follow the page h1 directly, skipping a level and breaking heading
        navigation. It is visually redundant, so it is exposed to assistive
        technology only.
      */}
      <h2 className="sr-only">{kind === "album" ? "Albums" : "Videos"}</h2>

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
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <li key={item.slug}>
              {kind === "album" ? (
                <GalleryCard album={item as GalleryAlbum} />
              ) : (
                <VideoCard video={item as Video} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
