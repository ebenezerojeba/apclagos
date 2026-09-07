import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { Article, Category } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice } from "@/components/admin/ListChrome";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteCategory, saveCategory } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Categories — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The newsroom taxonomy.
 *
 * List and form on one screen rather than three routes: a category is four
 * fields, and separate create and edit pages would mean two navigations to
 * rename one label. `?edit=<id>` selects which record the form is bound to, so
 * the state still lives in the URL and the back button works.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fcategories");

  const params = await searchParams;
  const editId = typeof params.edit === "string" ? params.edit : undefined;

  const categories = await safeRead(
    () => Category.find({}).sort({ order: 1, name: 1 }).lean(),
    [],
    "list categories",
  );

  // How many articles each category holds, so an editor can see what a delete
  // would orphan before they do it.
  const usage = await safeRead(
    () =>
      Article.aggregate<{ _id: unknown; total: number }>([
        { $match: { category: { $ne: null } } },
        { $group: { _id: "$category", total: { $sum: 1 } } },
      ]),
    [],
    "count articles per category",
  );
  const usageFor = new Map(usage.map((entry) => [String(entry._id), entry.total]));

  const editing =
    editId && isValidObjectId(editId)
      ? categories.find((category) => String(category._id) === editId)
      : undefined;

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Categories" }]}
      title="Categories"
      description="Groups articles in the newsroom. Removing a category leaves its articles in place — they simply become uncategorised."
    >
      <AdminNotice params={params} noun="category" />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          {categories.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-fg-muted">
              No categories yet. Add the first one using the form.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border bg-surface">
              {categories.map((category) => {
                const id = String(category._id);
                const count = usageFor.get(id) ?? 0;

                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base text-fg">{category.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-subtle">
                        <span className="font-mono">{category.slug}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tnum">
                          {count} {count === 1 ? "article" : "articles"}
                        </span>
                      </p>
                      {category.description ? (
                        <p className="mt-1 text-[0.8125rem] text-fg-muted">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <a
                        href={`/admin/categories?edit=${id}`}
                        className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                      >
                        Edit
                      </a>
                      {session.role === "owner" ? (
                        <DeleteButton
                          action={deleteCategory}
                          id={id}
                          describe={
                            count > 0
                              ? `${category.name} (${count} article${count === 1 ? "" : "s"} will become uncategorised)`
                              : category.name
                          }
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <CategoryForm
            action={saveCategory}
            key={editing ? String(editing._id) : "new"}
            initial={
              editing
                ? {
                    id: String(editing._id),
                    name: editing.name,
                    slug: editing.slug,
                    description: editing.description ?? "",
                    order: editing.order ?? undefined,
                  }
                : { name: "", slug: "", description: "" }
            }
          />
        </div>
      </div>
    </AdminShell>
  );
}
