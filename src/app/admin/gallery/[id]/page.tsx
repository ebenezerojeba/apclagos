import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { isValidObjectId } from "mongoose";
import { getActiveSession } from "@/lib/server/auth";
import { connectToDatabase, safeRead } from "@/lib/server/db";
import { EventModel, GALLERY_MAX_IMAGES, GalleryAlbum, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { toAlbumInitial } from "@/lib/server/admin/serialise";
import { updateAlbum } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Edit album — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getActiveSession();
  const { id } = await params;
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/gallery/${id}`)}`);
  }

  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const album = await GalleryAlbum.findById(id).lean();
  if (!album) notFound();

  const events = await safeRead(
    () => EventModel.find({}).select("title slug").sort({ startsAt: -1 }).limit(200).lean(),
    [],
    "list events for albums",
  );

  const initial = toAlbumInitial(album);

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Gallery", href: "/admin/gallery" },
        { label: initial.title || "Untitled" },
      ]}
      title={initial.title || "Untitled album"}
      actions={
        initial.status === "published" ? (
          <Link
            href={`/gallery/${initial.slug}`}
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
      <AlbumForm
        action={updateAlbum}
        initial={initial}
        canPublish={roleCan(session.role, "publish")}
        events={events.map((event) => ({ slug: event.slug, title: event.title }))}
        maxImages={GALLERY_MAX_IMAGES}
      />
    </AdminShell>
  );
}
