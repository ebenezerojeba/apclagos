import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageOff, Plus } from "lucide-react";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { GalleryAlbum } from "@/lib/server/models";
import { AdminShell, PrimaryLink } from "@/components/admin/AdminShell";
import { StatusPill, AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteAlbum } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Gallery — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Photo albums. Shown as cards with their cover, because an editor finds an
 * album by recognising the picture far faster than by reading its title.
 */
export default async function GalleryAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fgallery");

  const params = await searchParams;

  // Only the first photograph is needed for the card; the full list can run to
  // a hundred references, so it is sliced in the query rather than in memory.
  const albums = await safeRead(
    () =>
      GalleryAlbum.find({}, { images: { $slice: 1 } })
        .select("title slug status date category cover images")
        .sort({ date: -1, createdAt: -1 })
        .limit(300)
        .lean(),
    [],
    "list albums",
  );

  const counts = await safeRead(
    () =>
      GalleryAlbum.aggregate<{ _id: unknown; total: number }>([
        { $project: { total: { $size: { $ifNull: ["$images", []] } } } },
      ]),
    [],
    "count album photographs",
  );
  const photosIn = new Map(counts.map((entry) => [String(entry._id), entry.total]));

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Gallery" }]}
      title="Gallery"
      description="Photo albums from congresses, rallies, community visits and other occasions. Published albums appear in the gallery and on the homepage straight away."
      actions={
        <PrimaryLink href="/admin/gallery/new">
          <Plus className="size-4" aria-hidden="true" />
          New album
        </PrimaryLink>
      }
    >
      <AdminNotice params={params} noun="album" />

      {albums.length === 0 ? (
        <EmptyState
          title="No albums yet"
          body="Create an album, add photographs, and publish it — it appears in the gallery and on the homepage immediately."
          action={
            <PrimaryLink href="/admin/gallery/new">
              <Plus className="size-4" aria-hidden="true" />
              New album
            </PrimaryLink>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            const id = String(album._id);
            const cover = album.cover ?? album.images?.[0];
            const total = photosIn.get(id) ?? 0;
            return (
              <li key={id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
                <Link
                  href={`/admin/gallery/${id}`}
                  className="group relative block aspect-[4/3] bg-paper-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink-600"
                >
                  {cover?.secureUrl ? (
                    <Image
                      src={cover.secureUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
                      className="object-cover transition-opacity group-hover:opacity-90"
                      unoptimized
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-fg-subtle">
                      <ImageOff className="size-6" aria-hidden="true" />
                    </span>
                  )}
                  <span className="sr-only">Edit {album.title}</span>
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-display text-base text-fg">{album.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                    <StatusPill status={album.status} />
                    <span className="tnum">
                      {total} photograph{total === 1 ? "" : "s"}
                    </span>
                    {album.date ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <time dateTime={new Date(album.date).toISOString()}>
                          {new Date(album.date).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" })}
                        </time>
                      </>
                    ) : null}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <Link
                      href={`/admin/gallery/${id}`}
                      className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                    >
                      Edit
                    </Link>
                    {session.role === "owner" ? (
                      <DeleteButton action={deleteAlbum} id={id} describe={album.title} />
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
