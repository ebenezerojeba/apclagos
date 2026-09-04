"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { CouncilCard } from "@/components/cards/CouncilCard";
import {
  AlphabetIndex,
  FilterChips,
  ResultCount,
  SearchInput,
  Select,
} from "@/components/ui/controls";
import { NoResultsState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/Media";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Council, CouncilOfficial, Slug } from "@/types/content";

/**
 * The 57-council directory.
 *
 * All filtering happens in the browser over a list that is small enough to ship
 * whole (57 records), which keeps every interaction instant and every filter
 * combination reachable without a round trip. Larger collections on this site
 * (news, candidates) paginate instead.
 */
export function CouncilDirectory({
  councils,
  chairmen,
  lgaOptions,
  /** Restricts the type filter when the page is already scoped to one tier. */
  lockType,
}: {
  councils: Council[];
  chairmen: Record<Slug, CouncilOfficial>;
  lgaOptions: { value: string; label: string }[];
  lockType?: "LGA" | "LCDA";
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>(lockType ?? "");
  const [lga, setLga] = useState("");
  const [letter, setLetter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const deferredQuery = useDeferredValue(query);

  const lgaNameBySlug = useMemo(
    () => new Map(lgaOptions.map((o) => [o.value, o.label])),
    [lgaOptions],
  );

  const parentSlugOf = (council: Council) =>
    council.councilType === "LGA" ? council.slug : council.parentLgaSlug;

  const availableLetters = useMemo(
    () => new Set(councils.map((c) => c.name.charAt(0).toUpperCase())),
    [councils],
  );

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return councils.filter((council) => {
      if (type && council.councilType !== type) return false;
      if (lga && parentSlugOf(council) !== lga) return false;
      if (letter && council.name.charAt(0).toUpperCase() !== letter) return false;

      if (!needle) return true;

      const chairman = chairmen[council.slug];
      const haystack = [
        council.name,
        council.councilType,
        council.headquarters,
        lgaNameBySlug.get(parentSlugOf(council)),
        chairman?.name,
        chairman?.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [councils, chairmen, deferredQuery, type, lga, letter, lgaNameBySlug]);

  const typeCounts = useMemo(
    () => ({
      LGA: councils.filter((c) => c.councilType === "LGA").length,
      LCDA: councils.filter((c) => c.councilType === "LCDA").length,
    }),
    [councils],
  );

  const hasFilters = Boolean(query || (type && !lockType) || lga || letter);

  function reset() {
    setQuery("");
    setType(lockType ?? "");
    setLga("");
    setLetter("");
  }

  return (
    <div>
      {/* Controls */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] lg:items-end">
          <div>
            <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
              Search
            </span>
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Search councils by name, local government or chairman"
              placeholder="Search council or chairman…"
            />
          </div>
          <Select
            label="Local Government Area"
            value={lga}
            onChange={setLga}
            options={lgaOptions}
            placeholder="All local governments"
          />
        </div>

        {!lockType ? (
          <div className="mt-5 border-t border-border-subtle pt-5">
            <FilterChips
              label="Filter by council tier"
              value={type}
              onChange={setType}
              options={[
                { value: "", label: "All councils", count: councils.length },
                { value: "LGA", label: "LGAs", count: typeCounts.LGA },
                { value: "LCDA", label: "LCDAs", count: typeCounts.LCDA },
              ]}
            />
          </div>
        ) : null}

        <div className="mt-5 border-t border-border-subtle pt-5">
          <AlphabetIndex
            available={availableLetters}
            value={letter}
            onChange={setLetter}
          />
        </div>
      </div>

      {/* Results toolbar */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <ResultCount count={filtered.length} total={councils.length} noun="council" />
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              iconLeft={<SlidersHorizontal className="size-3.5" />}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Change layout"
          className="flex items-center gap-1 rounded-full border border-border bg-surface p-1"
        >
          <ViewToggle
            active={view === "grid"}
            onClick={() => setView("grid")}
            label="Grid view"
            icon={<LayoutGrid className="size-4" />}
          />
          <ViewToggle
            active={view === "list"}
            onClick={() => setView("list")}
            label="List view"
            icon={<List className="size-4" />}
          />
        </div>
      </div>

      {/*
        Card titles are h3. Without a heading for the results region they would
        follow the page h1 directly, skipping a level and breaking heading
        navigation. It is visually redundant, so it is exposed to assistive
        technology only.
      */}
      <h2 className="sr-only">Councils</h2>

      {/* Results */}
      {filtered.length === 0 ? (
        <NoResultsState
          className="mt-8"
          query={query.trim() || undefined}
          onReset={
            <Button variant="outline" onClick={reset}>
              Clear all filters
            </Button>
          }
        />
      ) : view === "grid" ? (
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((council) => (
            <li key={`${council.councilType}-${council.slug}`}>
              <CouncilCard
                council={council}
                chairman={chairmen[council.slug]}
                parentName={
                  council.councilType === "LCDA"
                    ? lgaNameBySlug.get(council.parentLgaSlug)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border-subtle bg-surface">
          <ul>
            {filtered.map((council, index) => {
              const chairman = chairmen[council.slug];
              const parentName =
                council.councilType === "LCDA"
                  ? lgaNameBySlug.get(council.parentLgaSlug)
                  : undefined;
              return (
                <li
                  key={`${council.councilType}-${council.slug}`}
                  className={cn(index > 0 && "border-t border-border-subtle")}
                >
                  <Link
                    href={`/${council.councilType === "LGA" ? "lgas" : "lcdas"}/${council.slug}`}
                    className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-paper-100 sm:px-6"
                  >
                    <Avatar
                      image={chairman?.portrait}
                      name={chairman?.name ?? council.name}
                      size={40}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base text-fg">
                          {council.name}
                        </span>
                        <Badge tone={council.councilType === "LGA" ? "ink" : "brass"}>
                          {council.councilType}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-[0.8125rem] text-fg-subtle">
                        {chairman
                          ? `${chairman.councilRole}: ${[chairman.honorific, chairman.name].filter(Boolean).join(" ")}`
                          : "Chairman profile pending"}
                        {parentName ? ` · ${parentName} LGA` : ""}
                      </span>
                    </span>
                    <span className="tnum hidden shrink-0 text-[0.8125rem] text-fg-subtle sm:block">
                      {council.wardCount ? `${council.wardCount} wards` : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-full transition-colors",
        active ? "bg-ink-900 text-white" : "text-fg-subtle hover:text-fg",
      )}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
