"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLink } from "@/components/layout/Brand";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { ArrowLink } from "@/components/ui/primitives";
import { primaryCta, primaryNav, siteConfig } from "@/data/site";
import { useScrolled } from "@/hooks";
import { cn } from "@/lib/utils";

/**
 * Site header.
 *
 * Desktop: a slim utility strip over a main bar with hover/keyboard mega menus.
 * Mobile: brand, search and a drawer trigger. The header condenses on scroll
 * rather than hiding, so navigation is always one reach away.
 *
 * Menus are buttons with `aria-expanded`/`aria-controls`; hover opens them for
 * pointer users, click and Enter/Space for everyone else, and Escape closes.
 */
export function Header({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname();
  const scrolled = useScrolled(8);
  const reduced = useReducedMotion();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLDivElement>(null);
  /**
   * Which menu was opened by hovering rather than by an explicit click.
   *
   * Without this, a mouse user gets a menu that fights them: moving onto the
   * trigger opens it, and the click that naturally follows toggles it straight
   * back shut. The first click on a hover-opened menu therefore only claims it
   * (so a second click closes it as expected); keyboard users, who never fire
   * the hover handler, get a plain toggle.
   */
  const openedByHover = useRef<string | null>(null);

  // Close menus whenever the route changes.
  useEffect(() => {
    openedByHover.current = null;
    setOpenMenu(null);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        openedByHover.current = null;
        setOpenMenu(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function scheduleClose() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      openedByHover.current = null;
      setOpenMenu(null);
    }, 140);
  }

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
  }

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable left-4 top-4 z-200 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-lg"
      >
        Skip to main content
      </a>

      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-shadow duration-300",
          scrolled && "shadow-[0_1px_0_0_var(--color-border-subtle),0_10px_30px_-24px_rgb(13_27_49/0.5)]",
        )}
      >
        {/* Utility strip */}
        <div className="hidden panel-ink border-b border-white/5 lg:block">
          <div className="container-page flex h-9 items-center justify-between text-[0.75rem]">
            <p className="text-ink-300">
              {siteConfig.legalName}
              <span aria-hidden="true" className="mx-2.5 text-ink-600">
                /
              </span>
              <span className="text-brass-300">{siteConfig.tagline}</span>
            </p>
            <nav aria-label="Utility" className="flex items-center gap-6">
              <Link href="/structure" className="on-ink text-ink-200 transition-colors hover:text-white">
                Political Structure
              </Link>
              <Link href="/documents" className="on-ink text-ink-200 transition-colors hover:text-white">
                Documents
              </Link>
              <Link href="/contact" className="on-ink text-ink-200 transition-colors hover:text-white">
                Contact
              </Link>
            </nav>
          </div>
        </div>

        {/* Main bar */}
        <div
          className={cn(
            "border-b border-border-subtle bg-surface/85 backdrop-blur-xl transition-[height] duration-300",
            scrolled ? "h-16" : "h-20",
          )}
        >
          <div className="container-page flex h-full items-center justify-between gap-3 2xl:gap-4">
            <BrandLink size={scrolled ? "sm" : "md"} />

            <div
              ref={navRef}
              className="hidden items-center xl:flex"
              onMouseLeave={scheduleClose}
            >
              <nav aria-label="Primary">
                <ul className="flex items-center">
                  {primaryNav.map((group) => {
                    const hasMenu = Boolean(group.columns?.length);
                    const active = isActive(group.href);
                    const menuId = `menu-${group.label.replace(/\W+/g, "-").toLowerCase()}`;

                    return (
                      <li
                        key={group.label}
                        className="relative"
                        onMouseEnter={() => {
                          cancelClose();
                          if (hasMenu) {
                            setOpenMenu((current) => {
                              if (current !== group.label)
                                openedByHover.current = group.label;
                              return group.label;
                            });
                          } else {
                            setOpenMenu(null);
                          }
                        }}
                      >
                        {hasMenu ? (
                          <button
                            type="button"
                            aria-expanded={openMenu === group.label}
                            aria-controls={openMenu === group.label ? menuId : undefined}
                            onClick={() => {
                              if (openedByHover.current === group.label) {
                                openedByHover.current = null;
                                setOpenMenu(group.label);
                                return;
                              }
                              setOpenMenu((current) =>
                                current === group.label ? null : group.label,
                              );
                            }}
                            className={cn(
                              "flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.8125rem] font-semibold tracking-tight transition-colors 2xl:px-3",
                              active || openMenu === group.label
                                ? "text-ink-900"
                                : "text-fg-muted hover:text-ink-900",
                            )}
                          >
                            {group.label}
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "size-3.5 transition-transform duration-200",
                                openMenu === group.label && "rotate-180",
                              )}
                            />
                          </button>
                        ) : (
                          <Link
                            href={group.href ?? "/"}
                            className={cn(
                              "flex items-center whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.8125rem] font-semibold tracking-tight transition-colors 2xl:px-3",
                              active ? "text-ink-900" : "text-fg-muted hover:text-ink-900",
                            )}
                          >
                            {group.label}
                          </Link>
                        )}

                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-crimson-700 2xl:inset-x-3"
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSearch}
                className="group flex h-10 items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 text-sm text-fg-subtle transition-colors hover:border-border-strong hover:text-fg 2xl:px-4"
              >
                <Search className="size-4" aria-hidden="true" />
                {/*
                  The label yields to the navigation between xl and 2xl: with
                  every top-level destination on one line the bar needs the room,
                  and the control still reads as search from its icon alone
                  (the accessible name below never goes away).
                */}
                <span className="hidden 2xl:inline">Search</span>
                <kbd className="ml-1 hidden rounded border border-border bg-paper-100 px-1.5 py-0.5 font-sans text-[0.625rem] font-semibold text-fg-subtle 2xl:inline">
                  /
                </kbd>
                <span className="sr-only">Open search</span>
              </button>

              <Button
                href={primaryCta.href}
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
              >
                {primaryCta.label}
              </Button>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-ink-800 transition-colors hover:border-border-strong xl:hidden"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {openMenu ? (
            <motion.div
              key={openMenu}
              initial={reduced ? undefined : { opacity: 0, y: -8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="absolute inset-x-0 top-full hidden border-b border-border bg-surface shadow-[0_28px_60px_-32px_rgb(13_27_49/0.4)] xl:block"
            >
              <MegaMenu label={openMenu} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <MobileNav
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenSearch={() => {
          setDrawerOpen(false);
          onOpenSearch();
        }}
      />
    </>
  );
}

function MegaMenu({ label }: { label: string }) {
  const group = primaryNav.find((g) => g.label === label);
  if (!group?.columns?.length) return null;
  const menuId = `menu-${label.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div
      id={menuId}
      className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_auto] lg:gap-16"
    >
      <div
        className={cn(
          "grid gap-10",
          group.columns.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1",
        )}
      >
        {group.columns.map((column) => (
          <div key={column.title}>
            <p className="eyebrow">
              <span aria-hidden="true" className="h-px w-5 bg-brass-400" />
              {column.title}
            </p>
            <ul className="mt-4 space-y-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group/link block rounded-lg px-3 py-2.5 transition-colors hover:bg-paper-100"
                  >
                    <span className="block text-sm font-semibold text-fg transition-colors group-hover/link:text-crimson-700">
                      {link.label}
                    </span>
                    {link.description ? (
                      <span className="mt-0.5 block text-[0.8125rem] text-fg-muted">
                        {link.description}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {group.feature ? (
        <aside className="relative w-full max-w-sm overflow-hidden rounded-2xl panel-ink p-7 lg:w-80">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-48 rounded-full bg-crimson-700/20 blur-3xl"
          />
          <p className="eyebrow text-brass-300">
            <span aria-hidden="true" className="h-px w-5 bg-brass-400/70" />
            {group.label}
          </p>
          <h3 className="mt-3 font-display text-xl text-white">{group.feature.title}</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-200">
            {group.feature.description}
          </p>
          <ArrowLink href={group.feature.href} tone="dark" className="mt-5">
            {group.feature.cta}
          </ArrowLink>
        </aside>
      ) : null}
    </div>
  );
}
