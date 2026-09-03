"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PersonCard } from "@/components/cards/PersonCard";
import {
  AlphabetIndex,
  ClientPagination,
  FilterChips,
  ResultCount,
  SearchInput,
  Select,
  type SelectOption,
} from "@/components/ui/controls";
import { AwaitingRecordsState, NoResultsState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import type { Person } from "@/types/content";

/**
 * A configurable people directory, used by leadership, representatives and
 * candidates.
 *
 * Everything it receives is plain data — the server computes each row's href and
 * context label, and facets filter on a named field rather than a callback.
 * That keeps the whole configuration serialisable across the server/client
 * boundary, so one component can cover every people-shaped listing without any
 * page hard-coding its own filter UI.
 */

export interface PersonRow {
  person: Person;
  href: string;
  /** Small label above the name, e.g. the chamber or the seat contested. */
  context?: string;
}

export interface PersonFacet {
  id: string;
  label: string;
  /** Chips for short option sets, a select for long ones. */
  display: "chips" | "select";
  /** Field on the person record this facet filters on, e.g. "body", "office". */
  field: string;
  options: SelectOption[];
  allLabel?: string;
}

function fieldValue(person: Person, field: string): string | undefined {
  const value = (person as unknown as Record<string, unknown>)[field];
  return typeof value === "string" ? value : undefined;
}

export function PersonDirectory({
  rows,
  facets = [],
  noun = "profile",
  searchLabel = "Search by name, office or constituency",
  searchPlaceholder = "Search name, office or constituency…",
  pageSize = 24,
  initialFacetValues,
  emptyWhat,
  emptyDataFile = "src/data/people.ts",
}: {
  rows: PersonRow[];
  facets?: PersonFacet[];
  /** Pre-selected facets, read from the URL by the page (e.g. `?body=…`). */
  initialFacetValues?: Record<string, string>;
  noun?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyWhat: string;
  emptyDataFile?: string;
}) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");
  const [page, setPage] = useState(1);
  const [facetValues, setFacetValues] = useState<Record<string, string>>(
    initialFacetValues ?? {},
  );

  const deferredQuery = useDeferredValue(query);

  const availableLetters = useMemo(
    () => new Set(rows.map((row) => row.person.name.charAt(0).toUpperCase())),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return rows.filter(({ person, context }) => {
      for (const facet of facets) {
        const wanted = facetValues[facet.id];
        if (wanted && fieldValue(person, facet.field) !== wanted) return false;
      }
      if (letter && person.name.charAt(0).toUpperCase() !== letter) return false;
      if (!needle) return true;

      const haystack = [
        person.name,
        person.honorific,
        person.position,
        person.shortPosition,
        person.jurisdiction,
        person.summary,
        context,
        ...(person.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [rows, facets, facetValues, letter, deferredQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasFilters =
    Boolean(query || letter) || Object.values(facetValues).some(Boolean);

  function reset() {
    setQuery("");
    setLetter("");
    setFacetValues({});
    setPage(1);
  }

  function setFacet(id: string, value: string) {
    setFacetValues((current) => ({ ...current, [id]: value }));
    setPage(1);
  }

  if (rows.length === 0) {
    return <AwaitingRecordsState what={emptyWhat} dataFile={emptyDataFile} />;
  }

  const chipFacets = facets.filter((f) => f.display === "chips");
  const selectFacets = facets.filter((f) => f.display === "select");

  return (
    <div>
      <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 lg:items-end">
          <div className="lg:col-span-2 xl:col-span-2">
            <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
              Search
            </span>
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              label={searchLabel}
              placeholder={searchPlaceholder}
            />
          </div>
          {selectFacets.map((facet) => (
            <Select
              key={facet.id}
              label={facet.label}
              value={facetValues[facet.id] ?? ""}
              onChange={(value) => setFacet(facet.id, value)}
              options={facet.options}
              placeholder={facet.allLabel ?? `All ${facet.label.toLowerCase()}`}
            />
          ))}
        </div>

        {chipFacets.map((facet) => (
          <div key={facet.id} className="mt-5 border-t border-border-subtle pt-5">
            <FilterChips
              label={facet.label}
              value={facetValues[facet.id] ?? ""}
              onChange={(value) => setFacet(facet.id, value)}
              options={[
                { value: "", label: facet.allLabel ?? "All", count: rows.length },
                ...facet.options,
              ]}
            />
          </div>
        ))}

        <div className="mt-5 border-t border-border-subtle pt-5">
          <AlphabetIndex
            available={availableLetters}
            value={letter}
            onChange={(value) => {
              setLetter(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <ResultCount count={filtered.length} total={rows.length} noun={noun} />
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
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((row) => (
              <li key={row.person.slug}>
                <PersonCard
                  person={row.person}
                  href={row.href}
                  context={row.context}
                />
              </li>
            ))}
          </ul>
          <ClientPagination
            className="mt-12"
            page={currentPage}
            pageCount={pageCount}
            onChange={(next) => {
              setPage(next);
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
        </>
      )}
    </div>
  );
}
