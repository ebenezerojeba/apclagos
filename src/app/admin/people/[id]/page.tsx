import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { isValidObjectId } from "mongoose";
import { getActiveSession } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { Person, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { PersonForm } from "@/components/admin/PersonForm";
import { personOptions, toPersonInitial } from "@/lib/server/admin/serialise";
import { updatePerson } from "@/lib/server/actions/people";

export const metadata: Metadata = {
  title: "Edit person — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Where this person appears on the public site, so the editor can check it. */
function publicHref(kind: string, slug: string): string | null {
  switch (kind) {
    case "leader":
      return `/leadership/${slug}`;
    case "senator":
      return `/representatives/senate/${slug}`;
    case "house-of-representatives":
      return `/representatives/house-of-representatives/${slug}`;
    case "house-of-assembly":
      return `/representatives/house-of-assembly/${slug}`;
    case "candidate":
      return `/candidates/${slug}`;
    default:
      return null;
  }
}

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getActiveSession();
  const { id } = await params;
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/people/${id}`)}`);
  }

  // A malformed id would otherwise throw a CastError deep in the driver rather
  // than producing the 404 this obviously is.
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const person = await Person.findById(id).lean();
  if (!person) notFound();

  const initial = toPersonInitial(person);
  const href = initial.status === "published" ? publicHref(initial.kind, initial.slug) : null;

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "People", href: "/admin/people" },
        { label: initial.name || "Untitled" },
      ]}
      title={initial.name || "Untitled record"}
      description={initial.position}
      actions={
        href ? (
          <Link
            href={href}
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
      <PersonForm
        action={updatePerson}
        initial={initial}
        options={personOptions()}
        canPublish={roleCan(session.role, "publish")}
      />
    </AdminShell>
  );
}
