import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { EventFormScreen } from "@/components/admin/EventFields";
import { blankEvent, lgaOptions } from "@/lib/server/admin/serialise";
import { createEvent } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "New event — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fevents%2Fnew");

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Events", href: "/admin/events" },
        { label: "New" },
      ]}
      title="New event"
      description="A title, a summary and a start time are required. Times are entered and displayed in West Africa Time."
    >
      <EventFormScreen
        action={createEvent}
        initial={blankEvent()}
        canPublish={roleCan(session.role, "publish")}
        lgas={lgaOptions()}
      />
    </AdminShell>
  );
}
