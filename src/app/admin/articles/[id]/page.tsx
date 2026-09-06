import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/server/auth";
import { connectToDatabase, safeRead } from "@/lib/server/db";
import { Article, Category, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { ArticleFormScreen } from "@/components/admin/ArticleFields";
import { toArticleInitial } from "@/lib/server/admin/serialise";
import { updateArticle } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Edit article — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/articles/${id}`)}`);
  }

  // A malformed id would otherwise surface as a driver CastError rather than
  // the 404 it plainly is.
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const article = await Article.findById(id).lean();
  if (!article) notFound();

  const categories = await safeRead(
    () => Category.find({}).select("name").sort({ order: 1, name: 1 }).lean(),
    [],
    "list categories",
  );

  const initial = toArticleInitial(article);

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "News & announcements", href: "/admin/articles" },
        { label: initial.title || "Untitled" },
      ]}
      title={initial.title || "Untitled"}
      actions={
        initial.status === "published" ? (
          <Link
            href={`/news/${initial.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            View on site
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null
      }
    >
      <ArticleFormScreen
        action={updateArticle}
        initial={initial}
        canPublish={roleCan(session.role, "publish")}
        categories={categories.map((category) => ({
          id: String(category._id),
          name: category.name,
        }))}
      />
    </AdminShell>
  );
}
