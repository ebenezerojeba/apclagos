import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { Person, PERSON_KINDS } from "@/lib/server/models";
import { AdminShell, PrimaryLink } from "@/components/admin/AdminShell";
import { StatusPill, AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { deletePerson } from "@/lib/server/actions/people";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const metadata: Metadata = {
  title: "People — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  leader: "State leadership",
  chairman: "Council chairmen",
  official: "Council officials",
  senator: "Senators",
  "house-of-representatives": "House of Representatives",
  "house-of-assembly": "House of Assembly",
  candidate: "Candidates",
};

/**
 * The people directory.
 *
 * Filtered by kind through the query string rather than client state, so a
 * filtered view is a URL an editor can bookmark or send to a colleague, and the
 * back button behaves. The list is read fresh on every request — an admin
 * screen showing a cached copy of what has just been edited is worse than a
 * slightly slower one.
 */
export default async function PeopleListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fpeople");

  const params = await searchParams;
  const kindParam = typeof params.kind === "string" ? params.kind : undefined;
  const kind = PERSON_KINDS.includes(kindParam as never) ? kindParam : undefined;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const filter: Record<string, unknown> = {};
  if (kind) filter.kind = kind;
  if (query) filter.name = { $regex: escapeRegExp(query), $options: "i" };

  const people = await safeRead(
    () =>
      Person.find(filter)
        .select("name position kind slug status order updatedAt portrait")
        .sort({ kind: 1, order: 1, name: 1 })
        .limit(500)
        .lean(),
    [],
    "list people",
  );

  const counts = await safeRead(
    () => Person.aggregate<{ _id: string; total: number }>([
      { $group: { _id: "$kind", total: { $sum: 1 } } },
    ]),
    [],
    "count people by kind",
  );
  const countFor = new Map(counts.map((entry) => [entry._id, entry.total]));
  const total = counts.reduce((sum, entry) => sum + entry.total, 0);

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "People" }]}
      title="People"
      description="Everyone the party publishes: state leadership, council chairmen and officials, senators, both federal chambers, the State House of Assembly and election candidates."
      actions={
        <PrimaryLink href={`/admin/people/new${kind ? `?kind=${kind}` : ""}`}>
          <Plus className="size-4" aria-hidden="true" />
          New person
        </PrimaryLink>
      }
    >
      <AdminNotice params={params} noun="record" />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/admin/people" active={!kind} label="All" count={total} />
        {PERSON_KINDS.map((entry) => (
          <FilterChip
            key={entry}
            href={`/admin/people?kind=${entry}`}
            active={kind === entry}
            label={KIND_LABELS[entry] ?? entry}
            count={countFor.get(entry) ?? 0}
          />
        ))}
      </div>

      <form className="mt-4 flex max-w-md gap-2">
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        <label htmlFor="people-search" className="sr-only">
          Search people by name
        </label>
        <input
          id="people-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name…"
          className="h-10 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200"
        />
        <button
          type="submit"
          className="rounded-full border border-border px-4 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
        >
          Search
        </button>
      </form>

      {people.length === 0 ? (
        <EmptyState
          title={query ? "No matches" : "No records yet"}
          body={
            query
              ? `Nothing matches “${query}”. Try a different spelling, or clear the search.`
              : "Add the first person and they will appear on the public site as soon as you publish them."
          }
          action={
            <PrimaryLink href={`/admin/people/new${kind ? `?kind=${kind}` : ""}`}>
              <Plus className="size-4" aria-hidden="true" />
              New person
            </PrimaryLink>
          }
        />
      ) : (
        <ul className="mt-6 divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border bg-surface">
          {people.map((person) => (
            <li
              key={String(person._id)}
              className="flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/people/${String(person._id)}`}
                  className="rounded font-display text-base text-fg transition-colors hover:text-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  {person.name}
                </Link>
                <p className="mt-0.5 truncate text-[0.8125rem] text-fg-muted">
                  {person.position}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-subtle">
                  <StatusPill status={person.status} />
                  <span>{KIND_LABELS[person.kind] ?? person.kind}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{person.slug}</span>
                  {!person.portrait ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-brass-600">No portrait</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/people/${String(person._id)}`}
                  className="rounded-full border border-border px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                >
                  Edit
                </Link>
                {session.role === "owner" ? (
                  <DeleteButton
                    action={deletePerson}
                    id={String(person._id)}
                    extra={{ kind: person.kind }}
                    describe={person.name}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-white"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
      }
    >
      {label}
      <span className="tnum opacity-60">{count}</span>
    </Link>
  );
}

/** Escapes user input before it is used in a `$regex` query. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
