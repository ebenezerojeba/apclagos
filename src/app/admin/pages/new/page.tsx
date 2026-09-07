import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/server/auth";
import { roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageFormScreen } from "@/components/admin/PageFields";
import { blankPage } from "@/lib/server/admin/serialise";
import { createPage } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "New page — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fpages%2Fnew");

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Pages", href: "/admin/pages" },
        { label: "New" },
      ]}
      title="New page"
      description="Only a title is required."
    >
      <PageFormScreen
        action={createPage}
        initial={blankPage()}
        canPublish={roleCan(session.role, "publish")}
      />
    </AdminShell>
  );
}
