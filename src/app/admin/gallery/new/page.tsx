import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { EventModel, GALLERY_MAX_IMAGES, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { blankAlbum } from "@/lib/server/admin/serialise";
import { createAlbum } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "New album — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewAlbumPage() {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fgallery%2Fnew");

  const events = await safeRead(
    () => EventModel.find({}).select("title slug").sort({ startsAt: -1 }).limit(200).lean(),
    [],
    "list events for albums",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Gallery", href: "/admin/gallery" },
        { label: "New" },
      ]}
      title="New album"
      description="Add the photographs, give the album a title, and publish. Save it as a draft if you want to finish the descriptions later."
    >
      <AlbumForm
        action={createAlbum}
        initial={blankAlbum()}
        canPublish={roleCan(session.role, "publish")}
        events={events.map((event) => ({ slug: event.slug, title: event.title }))}
        maxImages={GALLERY_MAX_IMAGES}
      />
    </AdminShell>
  );
}
