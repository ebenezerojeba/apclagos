import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { PERSON_KINDS, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { PersonForm } from "@/components/admin/PersonForm";
import { blankPerson, personOptions } from "@/lib/server/admin/serialise";
import { createPerson } from "@/lib/server/actions/people";

export const metadata: Metadata = {
  title: "New person — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fpeople%2Fnew");

  const params = await searchParams;
  // Pre-selects the kind when arriving from a filtered list, so the editor does
  // not have to re-choose what they were already looking at.
  const requested = typeof params.kind === "string" ? params.kind : undefined;
  const kind = PERSON_KINDS.includes(requested as never) ? requested! : "leader";

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "People", href: "/admin/people" },
        { label: "New" },
      ]}
      title="New person"
      description="Only the name, office and record type are required. Everything else can be filled in later."
    >
      <PersonForm
        action={createPerson}
        initial={blankPerson(kind)}
        options={personOptions()}
        canPublish={roleCan(session.role, "publish")}
      />
    </AdminShell>
  );
}
