import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { Page } from "@/lib/server/models";
import { AdminShell, PrimaryLink } from "@/components/admin/AdminShell";
import { StatusPill, AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deletePage } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Pages — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PageListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fpages");

  const params = await searchParams;

  const records = await safeRead(
    () =>
      Page.find({})
        .select("title slug status updatedAt")
        .sort({ order: 1, title: 1 })
        .limit(500)
        .lean(),
    [],
    "list pages",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Pages" }]}
      title="Pages"
      description="Free-form institutional pages, for content that does not belong in the newsroom or the calendar."
      actions={
        <PrimaryLink href="/admin/pages/new">
          <Plus className="size-4" aria-hidden="true" />
          New page
        </PrimaryLink>
      }
    >
      <AdminNotice params={params} noun="page" />

      {records.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="No pages yet."
          action={
            <PrimaryLink href="/admin/pages/new">
              <Plus className="size-4" aria-hidden="true" />
              New page
            </PrimaryLink>
          }
        />
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border bg-surface">
          {records.map((record) => (
            <li
              key={String(record._id)}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/pages/${String(record._id)}`}
                  className="rounded font-display text-base text-fg transition-colors hover:text-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  {record.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                  <StatusPill status={record.status} />

                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{record.slug}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/pages/${String(record._id)}`}
                  className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  Edit
                </Link>
                {session.role === "owner" ? (
                  <DeleteButton
                    action={deletePage}
                    id={String(record._id)}
                    describe={record.title}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
