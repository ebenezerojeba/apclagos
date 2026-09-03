import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Badge, JsonLd } from "@/components/ui/primitives";
import { ArticleBody } from "@/components/ui/ArticleBody";
import { SmartImage, SIZES, Avatar } from "@/components/ui/Media";
import { NewsCard } from "@/components/cards/ContentCards";
import { ShareRow } from "@/components/ui/ShareRow";
import { getNews, getNewsBySlug, getRelatedNews } from "@/lib/content";
import { newsCategoryMap } from "@/data/editorial";
import { articleJsonLd, buildMetadata } from "@/lib/seo";
import { formatDate, readingMinutes } from "@/lib/format";

export async function generateStaticParams() {
  const articles = await getNews();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return { title: "Article not found" };

  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/news/${article.slug}`,
    image: article.cover?.src,
    imageAlt: article.cover?.alt,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authors: article.author ? [article.author.name] : undefined,
    keywords: article.tags,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedNews(article, 3);
  const category = newsCategoryMap.get(article.category);
  const minutes = readingMinutes(article.body);

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          headline: article.title,
          description: article.excerpt,
          path: `/news/${article.slug}`,
          image: article.cover?.src,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          authorName: article.author?.name,
          section: category?.name,
        })}
      />

      <PageHeader
        eyebrow={article.kicker ?? category?.name}
        title={article.title}
        description={article.excerpt}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "News", href: "/news" },
          ...(category
            ? [{ name: category.name, href: `/news?category=${category.slug}` }]
            : []),
          { name: article.title, href: `/news/${article.slug}` },
        ]}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/12 pt-6 text-sm text-ink-200">
          {article.author ? (
            <span className="flex items-center gap-2.5">
              <Avatar image={article.author.avatar} name={article.author.name} size={32} />
              <span>
                <span className="block font-medium text-white">
                  {article.author.name}
                </span>
                {article.author.role ? (
                  <span className="block text-xs text-ink-400">
                    {article.author.role}
                  </span>
                ) : null}
              </span>
            </span>
          ) : null}
          <time dateTime={article.publishedAt} className="tnum">
            {formatDate(article.publishedAt)}
          </time>
          <span aria-hidden="true" className="size-1 rounded-full bg-white/25" />
          <span>{minutes} min read</span>
          {category ? (
            <Link href={`/news?category=${category.slug}`}>
              <Badge tone="inverse">{category.name}</Badge>
            </Link>
          ) : null}
        </div>
      </PageHeader>

      {article.cover ? (
        <div className="container-page -mt-6 sm:-mt-8">
          <figure>
            <SmartImage
              image={article.cover}
              aspect="event"
              sizes={SIZES.feature}
              priority
              className="rounded-2xl shadow-[var(--shadow-card)]"
            />
            {article.cover.caption ? (
              <figcaption className="mt-3 text-sm text-fg-subtle">
                {article.cover.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}

      <Section tone="canvas">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:gap-16">
          <article className="max-w-3xl">
            <ArticleBody blocks={article.body} />

            {article.tags?.length ? (
              <ul className="mt-12 flex flex-wrap gap-2 border-t border-border-subtle pt-6">
                {article.tags.map((tag) => (
                  <li key={tag}>
                    <Badge tone="outline">{tag}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              Share this article
            </h2>
            <ShareRow
              className="mt-4"
              title={article.title}
              path={`/news/${article.slug}`}
            />
          </aside>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="surface" ariaLabelledBy="related-news-heading">
          <SectionHeader
            as="h2"
            eyebrow="Newsroom"
            title={<span id="related-news-heading">Related articles</span>}
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <NewsCard article={item} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
