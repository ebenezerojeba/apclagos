import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { EventModel } from "@/lib/server/models";
import { AdminShell, PrimaryLink } from "@/components/admin/AdminShell";
import { StatusPill, AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteEvent } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Events — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EventListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fevents");

  const params = await searchParams;

  const records = await safeRead(
    () =>
      EventModel.find({})
        .select("title slug status startsAt category")
        .sort({ startsAt: -1 })
        .limit(500)
        .lean(),
    [],
    "list events",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Events" }]}
      title="Events"
      description="Congresses, rallies, meetings, town halls and commissionings. The calendar splits them into upcoming and past automatically."
      actions={
        <PrimaryLink href="/admin/events/new">
          <Plus className="size-4" aria-hidden="true" />
          New event
        </PrimaryLink>
      }
    >
      <AdminNotice params={params} noun="event" />

      {records.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          body="No events yet. Once published, upcoming events appear on the homepage and the events calendar."
          action={
            <PrimaryLink href="/admin/events/new">
              <Plus className="size-4" aria-hidden="true" />
              New event
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
                  href={`/admin/events/${String(record._id)}`}
                  className="rounded font-display text-base text-fg transition-colors hover:text-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  {record.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                  <StatusPill status={record.status} />
                  <span>{record.category.replace("-", " ")}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={new Date(record.startsAt).toISOString()}>
                    {new Date(record.startsAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Lagos",
                    })}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{record.slug}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/events/${String(record._id)}`}
                  className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  Edit
                </Link>
                {session.role === "owner" ? (
                  <DeleteButton
                    action={deleteEvent}
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
