import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Section } from "@/components/sections/Section";
import { PageHeader } from "@/components/sections/PageHeader";
import { Card } from "@/components/ui/primitives";
import { getSession, isAdminEnabled } from "@/lib/server/auth";
import { COLLECTIONS } from "@/lib/server/repository";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

/** Never cached: the response depends on the request's session. */
export const dynamic = "force-dynamic";

/**
 * The administrative entry point.
 *
 * Until a real identity provider is connected this route returns 404 — there is
 * no login form to probe, no placeholder credential to guess, and no client-side
 * flag to flip. Once `ADMIN_ENABLED=true` and `resolveSession()` is implemented,
 * an authenticated administrator sees the dashboard; anyone else is told to sign
 * in through the provider.
 */
export default async function AdminPage() {
  if (!isAdminEnabled()) notFound();

  const session = await getSession();

  if (!session) {
    return (
      <Section tone="canvas" size="lg">
        <div className="mx-auto max-w-lg text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink-50 text-ink-700"
          >
            <Lock className="size-5" />
          </span>
          <h1 className="mt-6 text-display-md">Sign in required</h1>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">
            The administrative area is protected by the party&rsquo;s identity
            provider. Sign in through it to continue. No credentials are handled
            by this application.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title={`Welcome, ${session.name}`}
        description={`Signed in as ${session.email} · role: ${session.role}`}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Administration", href: "/admin" },
        ]}
      />

      <Section tone="canvas">
        <Card className="mb-10 flex-row items-start gap-4 border-brass-200 bg-brass-100/50 p-5">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-brass-600"
            aria-hidden="true"
          />
          <div className="text-sm leading-relaxed text-fg-muted">
            <p>
              <strong className="font-semibold text-fg">
                Content backend not connected.
              </strong>{" "}
              Editing screens appear here once{" "}
              <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                CONTENT_API_URL
              </code>{" "}
              is set and{" "}
              <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                ApiContentRepository
              </code>{" "}
              is implemented against it.
            </p>
            <p className="mt-2">
              The contract every collection must satisfy — list, get, create,
              update, delete, publish, unpublish and image upload — is defined in{" "}
              <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                src/lib/server/repository.ts
              </code>
              .
            </p>
          </div>
        </Card>

        <h2 className="font-display text-xl text-fg">Managed collections</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.map((collection) => (
            <li
              key={collection}
              className="rounded-xl border border-border-subtle bg-surface px-4 py-3.5"
            >
              <span className="block text-sm font-medium capitalize text-fg">
                {collection.replace(/-/g, " ")}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-fg-subtle">
                <KeyRound className="size-3" aria-hidden="true" />
                Awaiting backend
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
