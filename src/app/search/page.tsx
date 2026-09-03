import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { EmptyState, NoResultsState } from "@/components/ui/states";
import { SearchPageInput } from "@/components/search/SearchPageInput";
import { getSearchIndex, groupResults, searchIndex } from "@/lib/search";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  return buildMetadata({
    title: query ? `Search results for “${query}”` : "Search",
    description:
      "Search people, candidates, local councils, wards, constituencies, news, events and documents across the APC Lagos platform.",
    path: "/search",
    // Search result pages are never useful in an index.
    noIndex: true,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";

  const index = await getSearchIndex();
  const results = query ? searchIndex(index, query, 120) : [];
  const groups = groupResults(results);

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for “${query}”` : "Search APC Lagos"}
        description={
          query
            ? `${results.length} ${results.length === 1 ? "match" : "matches"} across people, councils, constituencies, news, events and documents.`
            : "Search people, candidates, chairmen, local councils, wards, constituencies, news, events and documents."
        }
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Search", href: "/search" },
        ]}
      >
        <Suspense fallback={<div className="h-14" />}>
          <SearchPageInput initialQuery={query} />
        </Suspense>
      </PageHeader>

      <Section tone="canvas">
        {!query ? (
          <EmptyState
            title="What are you looking for?"
            description="Try a council name such as “Ikorodu North”, a constituency such as “Lagos West”, or a person's name."
          />
        ) : results.length === 0 ? (
          <NoResultsState
            query={query}
            onReset={
              <Link
                href="/search"
                className="text-sm font-semibold text-ink-800 underline-offset-4 hover:underline"
              >
                Clear the search
              </Link>
            }
          />
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.type} aria-labelledby={`results-${group.type}`}>
                <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle pb-3">
                  <h2
                    id={`results-${group.type}`}
                    className="font-display text-xl text-fg"
                  >
                    {group.label}
                  </h2>
                  <span className="tnum text-sm text-fg-subtle">
                    {group.results.length}
                  </span>
                </div>
                <ul className="mt-2">
                  {group.results.map((result) => (
                    <li key={result.id}>
                      <Link
                        href={result.href}
                        className="group flex items-start gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-surface"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-base text-fg transition-colors group-hover:text-crimson-700">
                            {result.title}
                          </span>
                          {result.subtitle ? (
                            <span className="mt-0.5 block text-[0.8125rem] text-fg-subtle">
                              {result.subtitle}
                            </span>
                          ) : null}
                          {result.description ? (
                            <span className="mt-1.5 block line-clamp-2 text-sm text-fg-muted">
                              {result.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 hidden shrink-0 text-[0.75rem] text-fg-subtle sm:block">
                          {result.href}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
