import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import { isDatabaseConfigured } from "@/lib/server/db";
import { LoginForm } from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/layout/Brand";

export const metadata: Metadata = {
  title: "Sign in — APC Lagos administration",
  robots: { index: false, follow: false },
};

/** The session is read per request, so this can never be cached. */
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session) redirect("/admin");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Wordmark size="lg" />
        </div>

        <h1 className="mt-10 text-center font-display text-2xl text-fg">
          Content administration
        </h1>
        <p className="mt-2 text-center text-sm text-fg-muted">
          Sign in to manage the party&rsquo;s published records.
        </p>

        {!isDatabaseConfigured() ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-crimson-200 bg-crimson-50 px-4 py-3 text-sm text-crimson-900"
          >
            The database is not configured on this deployment, so sign-in is
            unavailable. Set <code className="font-mono">MONGODB_URI</code> and redeploy.
          </p>
        ) : (
          <div className="mt-8 rounded-2xl border border-border-subtle bg-surface p-6 shadow-[var(--shadow-card)]">
            <LoginForm next={next} />
          </div>
        )}
      </div>
    </main>
  );
}
