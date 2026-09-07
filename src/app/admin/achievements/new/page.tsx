import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { Person, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AchievementFormScreen } from "@/components/admin/AchievementFields";
import { blankAchievement, lgaOptions } from "@/lib/server/admin/serialise";
import { createAchievement } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "New achievement — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewAchievementPage() {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fachievements%2Fnew");

  const people = await safeRead(
    () => Person.find({}).select("name slug").sort({ name: 1 }).limit(500).lean(),
    [],
    "list people for attribution",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Achievements", href: "/admin/achievements" },
        { label: "New" },
      ]}
      title="New achievement"
      description="A title and a one-sentence summary are required. Cite a source wherever one exists."
    >
      <AchievementFormScreen
        action={createAchievement}
        initial={blankAchievement()}
        canPublish={roleCan(session.role, "publish")}
        people={people.map((person) => ({ slug: person.slug, name: person.name }))}
        lgas={lgaOptions()}
      />
    </AdminShell>
  );
}
