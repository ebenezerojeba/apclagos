"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Landmark, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/controls";
import { cn } from "@/lib/utils";

/**
 * The political structure explorer.
 *
 * A drill-down through the four tiers of the party's organisation:
 *
 *   APC Lagos → Local Government Area → LCDA → Ward
 *
 * Rendered as three linked columns on desktop and as a stacked drill-down on
 * small screens, driven by the same state. Every tier also links out to its own
 * page, so the explorer is a shortcut rather than the only route to anything.
 */

export interface ExplorerLga {
  slug: string;
  name: string;
  districtName: string;
  districtSlug: string;
  lcdaSlugs: string[];
  federalConstituencies: { slug: string; name: string }[];
  stateConstituencies: { slug: string; name: string }[];
}

export interface ExplorerLcda {
  slug: string;
  name: string;
  parentLgaSlug: string;
}

export interface ExplorerWard {
  slug: string;
  name: string;
  code?: string;
  lgaSlug: string;
  lcdaSlug?: string;
}

export function StructureExplorer({
  lgas,
  lcdas,
  wards,
  districts,
}: {
  lgas: ExplorerLga[];
  lcdas: ExplorerLcda[];
  wards: ExplorerWard[];
  districts: { slug: string; name: string; lgaSlugs: string[] }[];
}) {
  const [districtFilter, setDistrictFilter] = useState("");
  const [query, setQuery] = useState("");
  const [selectedLga, setSelectedLga] = useState<string | null>(null);
  const [selectedLcda, setSelectedLcda] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const visibleLgas = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lgas.filter((lga) => {
      if (districtFilter && lga.districtSlug !== districtFilter) return false;
      if (!needle) return true;
      return lga.name.toLowerCase().includes(needle);
    });
  }, [lgas, districtFilter, query]);

  const activeLga = lgas.find((lga) => lga.slug === selectedLga) ?? null;
  const childLcdas = activeLga
    ? lcdas.filter((lcda) => lcda.parentLgaSlug === activeLga.slug)
    : [];
  const activeLcda = childLcdas.find((lcda) => lcda.slug === selectedLcda) ?? null;

  const tierWards = activeLcda
    ? wards.filter((ward) => ward.lcdaSlug === activeLcda.slug)
    : activeLga
      ? wards.filter((ward) => ward.lgaSlug === activeLga.slug)
      : [];

  const fade = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div>
      {/* Tier 1 — the state chapter */}
      <div className="overflow-hidden rounded-2xl panel-ink">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 lg:p-7">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-300">
              Tier 1 · State chapter
            </p>
            <h2 className="mt-2 font-display text-2xl text-white">
              All Progressives Congress, Lagos State
            </h2>
            <p className="mt-1.5 text-sm text-ink-300">
              20 Local Government Areas · 37 LCDAs · 3 senatorial districts
            </p>
          </div>
          <Link
            href="/leadership"
            className="on-ink inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            State executive
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="border-t border-white/10 p-6 lg:p-7">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Filter by senatorial district
          </p>
          <div role="group" aria-label="Filter by senatorial district" className="mt-3 flex flex-wrap gap-2">
            <TierChip
              active={districtFilter === ""}
              onClick={() => {
                setDistrictFilter("");
                setSelectedLga(null);
                setSelectedLcda(null);
              }}
            >
              All districts
            </TierChip>
            {districts.map((district) => (
              <TierChip
                key={district.slug}
                active={districtFilter === district.slug}
                onClick={() => {
                  setDistrictFilter(district.slug);
                  setSelectedLga(null);
                  setSelectedLcda(null);
                }}
              >
                {district.name.replace(" Senatorial District", "")}
                <span className="ml-1.5 text-[0.6875rem] opacity-70">
                  {district.lgaSlugs.length}
                </span>
              </TierChip>
            ))}
          </div>
        </div>
      </div>

      {/* Tiers 2–4 */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Tier 2 — LGAs */}
        <TierColumn
          tier={2}
          title="Local Government Areas"
          icon={<Landmark className="size-4" />}
          count={visibleLgas.length}
          allHref="/lgas"
        >
          <div className="px-4 pb-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              label="Search local government areas"
              placeholder="Search LGAs…"
            />
          </div>
          <ul className="scroll-fade-y max-h-[26rem] overflow-y-auto overscroll-contain px-2 pb-2">
            {visibleLgas.map((lga) => (
              <li key={lga.slug}>
                <TierButton
                  active={selectedLga === lga.slug}
                  onClick={() => {
                    setSelectedLga(lga.slug);
                    setSelectedLcda(null);
                  }}
                  label={lga.name}
                  meta={`${lga.lcdaSlugs.length} LCDAs`}
                />
              </li>
            ))}
            {visibleLgas.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-fg-subtle">
                No local governments match that search.
              </li>
            ) : null}
          </ul>
        </TierColumn>

        {/* Tier 3 — LCDAs */}
        <TierColumn
          tier={3}
          title="Local Council Development Areas"
          icon={<Users className="size-4" />}
          count={childLcdas.length}
          allHref="/lcdas"
        >
          <AnimatePresence mode="wait">
            {activeLga ? (
              <motion.div key={activeLga.slug} {...fade}>
                <div className="border-b border-border-subtle px-5 pb-3">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                    Within
                  </p>
                  <Link
                    href={`/lgas/${activeLga.slug}`}
                    className="text-sm font-semibold text-ink-800 hover:underline"
                  >
                    {activeLga.name} LGA
                  </Link>
                </div>
                <ul className="scroll-fade-y max-h-[22rem] overflow-y-auto overscroll-contain p-2">
                  {childLcdas.map((lcda) => (
                    <li key={lcda.slug}>
                      <TierButton
                        active={selectedLcda === lcda.slug}
                        onClick={() => setSelectedLcda(lcda.slug)}
                        label={lcda.name}
                        href={`/lcdas/${lcda.slug}`}
                      />
                    </li>
                  ))}
                  {childLcdas.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-fg-subtle">
                      No LCDAs were carved out of this local government.
                    </li>
                  ) : null}
                </ul>
              </motion.div>
            ) : (
              <motion.p
                key="empty-lcda"
                {...fade}
                className="px-5 py-10 text-center text-sm text-fg-subtle"
              >
                Choose a Local Government Area to see its LCDAs.
              </motion.p>
            )}
          </AnimatePresence>
        </TierColumn>

        {/* Tier 4 — wards + representation */}
        <TierColumn
          tier={4}
          title="Wards & representation"
          icon={<MapPin className="size-4" />}
          count={tierWards.length}
          allHref="/wards"
        >
          <AnimatePresence mode="wait">
            {activeLga ? (
              <motion.div key={`${activeLga.slug}-${activeLcda?.slug ?? "all"}`} {...fade} className="p-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                  Wards {activeLcda ? `in ${activeLcda.name}` : `in ${activeLga.name}`}
                </p>
                {tierWards.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {tierWards.map((ward) => (
                      <li
                        key={ward.slug}
                        className="rounded-full border border-border bg-paper-100 px-2.5 py-1 text-[0.75rem] text-fg-muted"
                      >
                        {ward.code ? (
                          <span className="tnum mr-1 font-semibold text-ink-700">
                            {ward.code}
                          </span>
                        ) : null}
                        {ward.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                    The ward register for this council has not been published
                    yet.{" "}
                    <Link href="/wards" className="text-ink-800 hover:underline">
                      About ward data
                    </Link>
                  </p>
                )}

                <div className="mt-6 space-y-4 border-t border-border-subtle pt-5">
                  <ExplorerFact
                    label="Senatorial district"
                    items={[
                      { name: activeLga.districtName, href: `/constituencies#${activeLga.districtSlug}` },
                    ]}
                  />
                  <ExplorerFact
                    label="Federal constituencies"
                    items={activeLga.federalConstituencies.map((f) => ({
                      name: f.name.replace(" Federal Constituency", ""),
                      href: `/constituencies#${f.slug}`,
                    }))}
                  />
                  <ExplorerFact
                    label="State constituencies"
                    items={activeLga.stateConstituencies.map((s) => ({
                      name: s.name,
                      href: `/constituencies#${s.slug}`,
                    }))}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="empty-ward"
                {...fade}
                className="px-5 py-10 text-center text-sm text-fg-subtle"
              >
                Choose a council to see its wards and the constituencies it falls
                within.
              </motion.p>
            )}
          </AnimatePresence>
        </TierColumn>
      </div>
    </div>
  );
}

function TierColumn({
  tier,
  title,
  icon,
  count,
  allHref,
  children,
}: {
  tier: number;
  title: string;
  icon: React.ReactNode;
  count: number;
  allHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[var(--shadow-card)]">
      <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div>
          <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-ink-500">
            <span aria-hidden="true">{icon}</span>
            Tier {tier}
          </p>
          <h2 className="mt-1.5 font-display text-lg leading-snug text-fg">{title}</h2>
        </div>
        <Link
          href={allHref}
          className="tnum shrink-0 rounded-full bg-paper-200 px-2.5 py-1 text-[0.75rem] font-semibold text-fg-muted transition-colors hover:bg-paper-300 hover:text-fg"
        >
          {count}
        </Link>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function TierChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "on-ink rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
        active
          ? "border-brass-300 bg-brass-300 text-ink-950"
          : "border-white/20 text-ink-200 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function TierButton({
  label,
  meta,
  active,
  onClick,
  href,
}: {
  label: string;
  meta?: string;
  active: boolean;
  onClick: () => void;
  href?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl transition-colors",
        active ? "bg-ink-50" : "hover:bg-paper-100",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="flex flex-1 items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={cn(
            "truncate text-sm",
            active ? "font-semibold text-ink-900" : "text-fg",
          )}
        >
          {label}
        </span>
        {meta ? (
          <span className="tnum shrink-0 text-[0.75rem] text-fg-subtle">{meta}</span>
        ) : null}
      </button>
      {href ? (
        <Link
          href={href}
          className="mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface hover:text-ink-800"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="sr-only">Open {label}</span>
        </Link>
      ) : null}
    </div>
  );
}

function ExplorerFact({
  label,
  items,
}: {
  label: string;
  items: { name: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        {label}
      </p>
      {items.length > 0 ? (
        <ul className="mt-1.5 space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-ink-800 underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-fg-subtle">—</p>
      )}
    </div>
  );
}
