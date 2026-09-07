"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The collection switcher.
 *
 * A client component purely so it can mark the current section from the
 * pathname. It scrolls horizontally on narrow screens rather than collapsing
 * into a menu — there are only eight destinations, and a menu would add a tap
 * to every navigation to save space that a scroll strip already saves.
 */

const SECTIONS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/people", label: "People" },
  { href: "/admin/articles", label: "News" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="border-t border-border-subtle">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-6">
        {SECTIONS.map((section) => {
          const current = section.exact
            ? pathname === section.href
            : pathname.startsWith(section.href);

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink-600",
                  current
                    ? "border-crimson-700 font-semibold text-fg"
                    : "border-transparent text-fg-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
