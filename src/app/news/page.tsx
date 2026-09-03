import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/ui/primitives";
import { NewsCard } from "@/components/cards/ContentCards";
import { NewsFilters } from "@/components/directories/NewsFilters";
import {
  AwaitingRecordsState,
  GridSkeleton,
  NoResultsState,
} from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { getNews, getPopularNews } from "@/lib/content";
import { newsCategories, newsCategoryMap } from "@/data/editorial";
import { buildMetadata } from "@/lib/seo";
import type { NewsCategorySlug } from "@/types/content";

const PAGE_SIZE = 9;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const page = Number(params.page ?? 1);
  const meta = newsCategoryMap.get(category as NewsCategorySlug);

  const title = meta ? `${meta.name} — News` : "News and press releases";
  const description = meta
    ? meta.description
    : "Announcements, statements and coverage from APC Lagos, its local councils and its elected representatives.";

  return buildMetadata({
    title: page > 1 ? `${title} — page ${page}` : title,
    description,
    path: category ? `/news?category=${category}` : "/news",
    // Deep pagination and search views add no unique value to the index.
    noIndex: page > 1 || typeof params.q === "string",
  });
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [all, popular] = await Promise.all([getNews(), getPopularNews(5)]);

  const counts = all.reduce<Record<string, number>>((acc, article) => {
    acc[article.category] = (acc[article.category] ?? 0) + 1;
    return acc;
  }, {});

  const needle = query.toLowerCase();
  const filtered = all.filter((article) => {
    if (category && article.category !== category) return false;
    if (!needle) return true;
    return [article.title, article.excerpt, article.kicker, ...(article.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function pageHref(target: number) {
    const next = new URLSearchParams();
    if (category) next.set("category", category);
    if (query) next.set("q", query);
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `/news?${qs}` : "/news";
  }

  return (
    <>
      <PageHeader
        eyebrow="Newsroom"
        title={
          newsCategoryMap.get(category as NewsCategorySlug)?.name ??
          "News and press releases"
        }
        description={
          newsCategoryMap.get(category as NewsCategorySlug)?.description ??
          "Announcements, statements and coverage from the state chapter, its local councils and its elected representatives."
        }
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "News", href: "/news" },
          ...(category
            ? [
                {
                  name: newsCategoryMap.get(category as NewsCategorySlug)?.name ?? category,
                  href: `/news?category=${category}`,
                },
              ]
            : []),
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Published articles", value: all.length },
            { label: "Categories", value: Object.keys(counts).length },
            { label: "Showing", value: filtered.length },
            { label: "Page", value: `${currentPage} of ${pageCount}` },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        <Suspense
          fallback={
            <div className="h-40 rounded-2xl border border-border-subtle bg-surface" />
          }
        >
          <NewsFilters
            categories={newsCategories}
            counts={counts}
            total={all.length}
          />
        </Suspense>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-14">
          <div>
            {all.length === 0 ? (
              <AwaitingRecordsState
                what="News articles"
                dataFile="src/data/editorial.ts"
              />
            ) : visible.length === 0 ? (
              <NoResultsState
                query={query || undefined}
                onReset={
                  <Button href="/news" variant="outline">
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <Suspense fallback={<GridSkeleton count={6} />}>
                  <ul className="grid gap-5 sm:grid-cols-2">
                    {visible.map((article, index) => (
                      <li key={article.slug}>
                        <NewsCard
                          article={article}
                          priority={currentPage === 1 && index < 2}
                        />
                      </li>
                    ))}
                  </ul>
                </Suspense>

                {pageCount > 1 ? (
                  <nav
                    aria-label="Pagination"
                    className="mt-12 flex flex-wrap items-center justify-center gap-1.5"
                  >
                    {currentPage > 1 ? (
                      <Link
                        href={pageHref(currentPage - 1)}
                        rel="prev"
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                      >
                        Previous
                      </Link>
                    ) : null}
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                      <Link
                        key={n}
                        href={pageHref(n)}
                        aria-current={n === currentPage ? "page" : undefined}
                        className={`tnum inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                          n === currentPage
                            ? "bg-ink-900 text-white"
                            : "border border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
                        }`}
                      >
                        {n}
                      </Link>
                    ))}
                    {currentPage < pageCount ? (
                      <Link
                        href={pageHref(currentPage + 1)}
                        rel="next"
                        className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                      >
                        Next
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            {popular.length > 0 ? (
              <>
                <SectionHeader as="h2" title="Most read" className="!block" />
                <ul className="mt-6 space-y-4">
                  {popular.map((article) => (
                    <li key={article.slug}>
                      <NewsCard article={article} layout="row" />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <h2 className="mt-10 font-display text-lg text-fg">Browse by category</h2>
            <ul className="mt-4 space-y-1">
              {newsCategories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/news?category=${c.slug}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      category === c.slug
                        ? "bg-ink-50 font-semibold text-ink-900"
                        : "text-fg-muted hover:bg-paper-100 hover:text-fg"
                    }`}
                  >
                    {c.name}
                    <span className="tnum text-xs text-fg-subtle">
                      {counts[c.slug] ?? 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>
    </>
  );
}
