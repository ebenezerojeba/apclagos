"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal, ModalCloseButton } from "@/components/ui/Modal";
import { Wordmark } from "@/components/layout/Brand";
import { Button } from "@/components/ui/Button";
import { legalNav, primaryCta, primaryNav, siteContact } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Mobile navigation drawer.
 *
 * Slides in from the right, traps focus, locks scroll and mirrors the desktop
 * information architecture — groups become accordions so the whole structure is
 * reachable without leaving the drawer.
 */
export function MobileNav({
  open,
  onClose,
  onOpenSearch,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Open the section the visitor is currently in.
  useEffect(() => {
    if (!open) return;
    const current = primaryNav.find(
      (group) =>
        group.href &&
        group.href !== "/" &&
        (pathname === group.href || pathname.startsWith(`${group.href}/`)),
    );
    setExpanded(current?.columns?.length ? current.label : null);
  }, [open, pathname]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      align="right"
      label="Site navigation"
      panelClassName="h-full w-full max-w-[26rem] bg-surface shadow-[var(--shadow-overlay)]"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <Link href="/" onClick={onClose} aria-label="APC Lagos — home">
            <Wordmark size="sm" />
          </Link>
          <ModalCloseButton onClose={onClose} label="Close menu" />
        </div>

        <div className="shrink-0 border-b border-border-subtle p-5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-12 w-full items-center gap-3 rounded-xl border border-border bg-paper-100 px-4 text-sm text-fg-subtle transition-colors hover:border-border-strong"
          >
            <Search className="size-4" aria-hidden="true" />
            Search people, councils, news…
          </button>
        </div>

        <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <ul className="space-y-0.5">
            {primaryNav.map((group) => {
              const hasChildren = Boolean(group.columns?.length);
              const isOpen = expanded === group.label;
              const active =
                group.href &&
                (group.href === "/"
                  ? pathname === "/"
                  : pathname === group.href || pathname.startsWith(`${group.href}/`));
              const panelId = `mobile-panel-${group.label.replace(/\W+/g, "-").toLowerCase()}`;

              if (!hasChildren) {
                return (
                  <li key={group.label}>
                    <Link
                      href={group.href ?? "/"}
                      onClick={onClose}
                      className={cn(
                        "flex items-center rounded-xl px-4 py-3 text-[0.9375rem] font-semibold transition-colors",
                        active ? "bg-ink-50 text-ink-900" : "text-fg hover:bg-paper-100",
                      )}
                    >
                      {group.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={group.label}>
                  <div className="flex items-stretch gap-1">
                    <Link
                      href={group.href ?? "/"}
                      onClick={onClose}
                      className={cn(
                        "flex flex-1 items-center rounded-xl px-4 py-3 text-[0.9375rem] font-semibold transition-colors",
                        active ? "bg-ink-50 text-ink-900" : "text-fg hover:bg-paper-100",
                      )}
                    >
                      {group.label}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setExpanded(isOpen ? null : group.label)}
                      className="flex w-12 items-center justify-center rounded-xl text-fg-subtle transition-colors hover:bg-paper-100 hover:text-fg"
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "size-4 transition-transform duration-200",
                          isOpen && "rotate-180",
                        )}
                      />
                      <span className="sr-only">
                        {isOpen ? "Collapse" : "Expand"} {group.label}
                      </span>
                    </button>
                  </div>

                  <div
                    id={panelId}
                    hidden={!isOpen}
                    className="ml-4 border-l border-border-subtle pl-3"
                  >
                    {group.columns?.map((column) => (
                      <div key={column.title} className="py-2">
                        <p className="px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
                          {column.title}
                        </p>
                        <ul>
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                onClick={onClose}
                                className="block rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-paper-100 hover:text-fg"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 space-y-4 border-t border-border-subtle p-5">
          <Button href={primaryCta.href} variant="secondary" fullWidth onClick={onClose}>
            {primaryCta.label}
          </Button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem] text-fg-subtle">
            {legalNav.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose} className="hover:text-fg">
                {link.label}
              </Link>
            ))}
          </div>
          {siteContact.emails?.[0] ? (
            <a
              href={`mailto:${siteContact.emails[0]}`}
              className="block text-[0.8125rem] text-fg-muted hover:text-fg"
            >
              {siteContact.emails[0]}
            </a>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
