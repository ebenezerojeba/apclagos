import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { Category, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { ArticleFormScreen } from "@/components/admin/ArticleFields";
import { blankArticle } from "@/lib/server/admin/serialise";
import { createArticle } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "New article — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Farticles%2Fnew");

  const categories = await safeRead(
    () => Category.find({}).select("name").sort({ order: 1, name: 1 }).lean(),
    [],
    "list categories",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "News & announcements", href: "/admin/articles" },
        { label: "New" },
      ]}
      title="New article"
      description="A headline and an excerpt are required. The body can be built up over several sittings — save it as a draft until it is ready."
    >
      <ArticleFormScreen
        action={createArticle}
        initial={blankArticle()}
        canPublish={roleCan(session.role, "publish")}
        categories={categories.map((category) => ({
          id: String(category._id),
          name: category.name,
        }))}
      />
    </AdminShell>
  );
}
