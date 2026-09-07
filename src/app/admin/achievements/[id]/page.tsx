import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { isValidObjectId } from "mongoose";
import { getActiveSession } from "@/lib/server/auth";
import { connectToDatabase, safeRead } from "@/lib/server/db";
import { Achievement, Person, roleCan } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AchievementFormScreen } from "@/components/admin/AchievementFields";
import { lgaOptions, toAchievementInitial } from "@/lib/server/admin/serialise";
import { updateAchievement } from "@/lib/server/actions/content";

export const metadata: Metadata = {
  title: "Edit achievement — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getActiveSession();
  const { id } = await params;
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(`/admin/achievements/${id}`)}`);
  }

  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const record = await Achievement.findById(id).lean();
  if (!record) notFound();

  const people = await safeRead(
    () => Person.find({}).select("name slug").sort({ name: 1 }).limit(500).lean(),
    [],
    "list people for attribution",
  );

  const initial = toAchievementInitial(record);

  return (
    <AdminShell
      session={session}
      crumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Achievements", href: "/admin/achievements" },
        { label: initial.title || "Untitled" },
      ]}
      title={initial.title || "Untitled"}
      actions={
        initial.status === "published" ? (
          <Link
            href="/achievements"
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
      <AchievementFormScreen
        action={updateAchievement}
        initial={initial}
        canPublish={roleCan(session.role, "publish")}
        people={people.map((person) => ({ slug: person.slug, name: person.name }))}
        lgas={lgaOptions()}
      />
    </AdminShell>
  );
}
