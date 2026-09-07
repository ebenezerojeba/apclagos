import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { roleCan, Settings } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice } from "@/components/admin/ListChrome";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { toImageValue } from "@/lib/server/admin/serialise";
import { saveSettings } from "@/lib/server/actions/system";

export const metadata: Metadata = {
  title: "Site settings — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The singleton settings document.
 *
 * Restricted to the `settings` capability, which only an owner holds: these
 * values appear in the footer and on the contact page of every route, so a
 * mistake here is visible everywhere at once.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fsettings");

  const params = await searchParams;
  const allowed = roleCan(session.role, "settings");

  const settings = await safeRead(
    () => Settings.findOne({ key: "site" }).lean(),
    null,
    "read settings",
  );

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
      title="Site settings"
      description="The party's contact details and social channels, as they appear in the footer and on the contact page."
    >
      <AdminNotice params={params} noun="setting" />

      {!allowed ? (
        <p
          role="status"
          className="rounded-xl border border-brass-200 bg-brass-100/60 p-4 text-sm text-fg-muted"
        >
          These settings can only be changed by an account with the owner role.
          You can see the current values below.
        </p>
      ) : null}

      <div className={allowed ? "" : "pointer-events-none mt-6 opacity-60"}>
        <SettingsForm
          action={saveSettings}
          initial={{
            organisationName: settings?.organisationName ?? "",
            tagline: settings?.tagline ?? "",
            description: settings?.description ?? "",
            addressLines: settings?.addressLines ?? [],
            city: settings?.city ?? "",
            state: settings?.state ?? "",
            phones: settings?.phones ?? [],
            emails: settings?.emails ?? [],
            openingHours: settings?.openingHours ?? "",
            mapQuery: settings?.mapQuery ?? "",
            social: {
              facebook: settings?.social?.facebook ?? "",
              x: settings?.social?.x ?? "",
              instagram: settings?.social?.instagram ?? "",
              linkedin: settings?.social?.linkedin ?? "",
              youtube: settings?.social?.youtube ?? "",
            },
            logo: toImageValue(settings?.logo),
          }}
        />
      </div>
    </AdminShell>
  );
}
