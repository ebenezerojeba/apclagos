import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { Page, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageFormScreen } from "@/components/admin/PageFields";
import { toPageInitial } from "@/lib/server/admin/serialise";
import { updatePage } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Edit page — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/pages/${id}`)}`);
  }

  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const page = await Page.findById(id).lean();
  if (!page) notFound();

  const initial = toPageInitial(page);

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Pages", href: "/admin/pages" },
        { label: initial.title || "Untitled" },
      ]}
      title={initial.title || "Untitled"}
    >
      <PageFormScreen
        action={updatePage}
        initial={initial}
        canPublish={roleCan(session.role, "publish")}
      />
    </AdminShell>
  );
}
