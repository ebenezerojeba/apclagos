import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { getActiveSession } from "@/lib/server/auth";
import { safeRead } from "@/lib/server/db";
import { ContactMessage, CONTACT_STATUSES } from "@/lib/server/models";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotice, EmptyState } from "@/components/admin/ListChrome";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { MessageStatus } from "@/components/admin/MessageStatus";
import { deleteMessage, setMessageStatus } from "@/lib/server/actions/messages";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Messages — APC Lagos administration",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  new: "border-crimson-300 bg-crimson-50 text-crimson-800",
  read: "border-border bg-paper-200 text-fg-muted",
  handled: "border-verdant-300 bg-verdant-50 text-verdant-700",
  spam: "border-brass-200 bg-brass-100 text-brass-600",
};

/**
 * The contact inbox.
 *
 * Messages arrive here from the public contact form. They are shown in full
 * rather than truncated behind a "view" link: an enquiry is usually two
 * sentences, and making someone click through forty times to triage a morning's
 * post is the kind of interface that stops getting used.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getActiveSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fmessages");

  const params = await searchParams;
  const filter = typeof params.status === "string" ? params.status : undefined;
  // `find` narrows to the union; `includes` would leave this a bare string and
  // the query would not typecheck against the schema's enum.
  const active = CONTACT_STATUSES.find((status) => status === filter);

  const messages = await safeRead(
    () =>
      ContactMessage.find(active ? { status: active } : {})
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
    [],
    "list contact messages",
  );

  const counts = await safeRead(
    () =>
      ContactMessage.aggregate<{ _id: string; total: number }>([
        { $group: { _id: "$status", total: { $sum: 1 } } },
      ]),
    [],
    "count contact messages",
  );
  const countFor = new Map(counts.map((entry) => [entry._id, entry.total]));
  const total = counts.reduce((sum, entry) => sum + entry.total, 0);

  return (
    <AdminShell
      session={session}
      crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Messages" }]}
      title="Messages"
      description="Enquiries submitted through the public contact form. Every submission is stored here — nothing depends on an email inbox staying reachable."
    >
      <AdminNotice params={params} noun="message" />

      <div className="flex flex-wrap items-center gap-2">
        <Chip href="/admin/messages" active={!active} label="All" count={total} />
        {CONTACT_STATUSES.map((status) => (
          <Chip
            key={status}
            href={`/admin/messages?status=${status}`}
            active={active === status}
            label={status[0].toUpperCase() + status.slice(1)}
            count={countFor.get(status) ?? 0}
          />
        ))}
      </div>

      {messages.length === 0 ? (
        <EmptyState
          title={active ? `Nothing marked ${active}` : "No messages yet"}
          body={
            active
              ? "Try another filter, or clear it to see every message."
              : "Enquiries from the public contact form appear here as soon as they are submitted."
          }
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((message) => {
            const id = String(message._id);
            return (
              <li
                key={id}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base text-fg">{message.name}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider",
                          STATUS_STYLE[message.status] ?? STATUS_STYLE.read,
                        )}
                      >
                        {message.status}
                      </span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-fg-muted">
                      <a
                        href={`mailto:${message.email}`}
                        className="inline-flex items-center gap-1.5 rounded hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                      >
                        <Mail className="size-3.5" aria-hidden="true" />
                        {message.email}
                      </a>
                      {message.phone ? (
                        <a
                          href={`tel:${message.phone}`}
                          className="inline-flex items-center gap-1.5 rounded hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
                        >
                          <Phone className="size-3.5" aria-hidden="true" />
                          {message.phone}
                        </a>
                      ) : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.8125rem] font-medium text-fg">{message.subject}</p>
                    <time
                      dateTime={new Date(message.createdAt).toISOString()}
                      className="tnum text-xs text-fg-subtle"
                    >
                      {new Date(message.createdAt).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Africa/Lagos",
                      })}
                    </time>
                  </div>
                </div>

                {/* The sender's own words, rendered as text — never as markup. */}
                <p className="mt-3 whitespace-pre-wrap border-t border-border-subtle pt-3 text-sm leading-relaxed text-fg">
                  {message.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <MessageStatus
                    action={setMessageStatus}
                    id={id}
                    current={message.status}
                  />
                  {session.role === "owner" ? (
                    <DeleteButton
                      action={deleteMessage}
                      id={id}
                      describe={`the message from ${message.name}`}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}

function Chip({
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
