import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { EventModel, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventFormScreen } from "@/components/admin/EventFields";
import { lgaOptions, toEventInitial } from "@/lib/server/admin/serialise";
import { updateEvent } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Edit event — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/events/${id}`)}`);
  }

  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const event = await EventModel.findById(id).lean();
  if (!event) notFound();

  const initial = toEventInitial(event);

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Events", href: "/admin/events" },
        { label: initial.title || "Untitled" },
      ]}
      title={initial.title || "Untitled"}
      actions={
        initial.status === "published" ? (
          <Link
            href={`/events/${initial.slug}`}
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
      <EventFormScreen
        action={updateEvent}
        initial={initial}
        canPublish={roleCan(session.role, "publish")}
        lgas={lgaOptions()}
      />
    </AdminShell>
  );
}
