import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { Achievement } from "@/lib/server/models";
import { AdminShell, PrimaryLink } from "@/components/admin/AdminShell";
import { StatusPill, AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteAchievement } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Achievements — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AchievementsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fachievements");

  const params = await searchParams;

  const records = await safeRead(
    () =>
      Achievement.find({})
        .select("title slug status year category personSlug source")
        .sort({ year: -1, order: 1, title: 1 })
        .limit(500)
        .lean(),
    [],
    "list achievements",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Achievements" }]}
      title="Achievements"
      description="Projects, programmes and milestones. Each entry can be credited to a named person and should cite the ministry, agency or council that published it."
      actions={
        <PrimaryLink href="/admin/achievements/new">
          <Plus className="size-4" aria-hidden="true" />
          New achievement
        </PrimaryLink>
      }
    >
      <AdminNotice params={params} noun="achievement" />

      {records.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          body="Add the first achievement and it appears on the public achievements page as soon as you publish it."
          action={
            <PrimaryLink href="/admin/achievements/new">
              <Plus className="size-4" aria-hidden="true" />
              New achievement
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
                  href={`/admin/achievements/${String(record._id)}`}
                  className="rounded font-display text-base text-fg transition-colors hover:text-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  {record.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                  <StatusPill status={record.status} />
                  <span>{record.category.replace("-", " ")}</span>
                  {record.year ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tnum">{record.year}</span>
                    </>
                  ) : null}
                  {record.personSlug ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{record.personSlug}</span>
                    </>
                  ) : null}
                  {!record.source ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-brass-600">No source cited</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/achievements/${String(record._id)}`}
                  className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  Edit
                </Link>
                {session.role === "owner" ? (
                  <DeleteButton
                    action={deleteAchievement}
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
