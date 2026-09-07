import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { cloudinaryMissingVars } from "@/lib/server/cloudinary";
import { Media } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { MediaCard } from "@/components/admin/MediaCard";
import { deleteMedia, updateMedia } from "@/lib/server/actions/system";

export const metadata: Metadata = {
  title: "Media library — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Everything uploaded through the admin.
 *
 * The library is an index, not the store — Cloudinary holds the files. Its
 * purpose is to make what has been uploaded visible and describable, which
 * Cloudinary's own dashboard cannot do because it knows nothing about which
 * record an image belongs to.
 *
 * There is no upload control here on purpose. Images are uploaded from the
 * record that needs them, which is what guarantees every asset has a reason to
 * exist and alternative text written by someone who knows what it shows.
 */
export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fmedia");

  const params = await searchParams;
  const missing = cloudinaryMissingVars();

  const assets = await safeRead(
    () => Media.find({}).sort({ createdAt: -1 }).limit(300).lean(),
    [],
    "list media",
  );

  const totalBytes = assets.reduce((sum, asset) => sum + (asset.bytes ?? 0), 0);

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Media" }]}
      title="Media library"
      description="Every image uploaded through the admin. Files are stored on Cloudinary; this is the index that makes them findable and describable."
    >
      <AdminNotice params={params} noun="asset" />

      {missing.length > 0 ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-brass-200 bg-brass-100/60 p-4"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brass-600" aria-hidden="true" />
          <p className="text-sm text-fg-muted">
            Image upload is unavailable: {missing.join(", ")}{" "}
            {missing.length === 1 ? "is" : "are"} not set on this deployment.
          </p>
        </div>
      ) : null}

      {assets.length === 0 ? (
        <EmptyState
          title="Nothing uploaded yet"
          body="Images are uploaded from the record that uses them — a person's portrait, an article's cover — and appear here automatically."
        />
      ) : (
        <>
          <p className="mb-5 text-[0.8125rem] text-fg-muted">
            <span className="tnum">{assets.length}</span>{" "}
            {assets.length === 1 ? "asset" : "assets"} ·{" "}
            <span className="tnum">{(totalBytes / 1024 / 1024).toFixed(1)} MB</span>
          </p>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <li key={String(asset._id)}>
                <MediaCard
                  action={updateMedia}
                  deleteAction={deleteMedia}
                  canDelete={session.role === "owner"}
                  asset={{
                    id: String(asset._id),
                    publicId: asset.publicId,
                    secureUrl: asset.secureUrl,
                    width: asset.width,
                    height: asset.height,
                    format: asset.format,
                    bytes: asset.bytes,
                    alt: asset.alt ?? "",
                    caption: asset.caption ?? "",
                    credit: asset.credit ?? "",
                    tags: Array.isArray(asset.tags) ? asset.tags.map(String) : [],
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
