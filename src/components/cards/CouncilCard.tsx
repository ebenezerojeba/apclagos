import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { Badge, Card, CardLink } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/Media";
import { cn } from "@/lib/utils";
import type { Council, CouncilOfficial } from "@/types/content";

/**
 * Directory card for a local council — either tier.
 *
 * Where a chairman has been published the card shows the person; where one has
 * not, it says so plainly instead of inventing a name or leaving a hole.
 */
export function CouncilCard({
  council,
  chairman,
  parentName,
  className,
}: {
  council: Council;
  chairman?: CouncilOfficial;
  /** Parent LGA name, shown on LCDA cards. */
  parentName?: string;
  className?: string;
}) {
  const isLga = council.councilType === "LGA";
  const href = `/${isLga ? "lgas" : "lcdas"}/${council.slug}`;

  return (
    <Card as="article" interactive className={cn("group h-full", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 pb-4 pt-5">
        <div className="min-w-0">
          <Badge tone={isLga ? "ink" : "brass"}>{council.councilType}</Badge>
          <h3 className="mt-2.5 font-display text-xl leading-tight text-fg">
            <CardLink href={href} ariaLabel={`Open ${council.name}`}>
              {council.name}
            </CardLink>
          </h3>
          {parentName ? (
            <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] text-fg-subtle">
              <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{parentName} LGA</span>
            </p>
          ) : null}
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="size-5 shrink-0 text-paper-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-700"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 px-5 py-4">
        {chairman ? (
          <div className="flex items-center gap-3">
            <Avatar image={chairman.portrait} name={chairman.name} size={44} />
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
                {chairman.councilRole}
              </p>
              <p className="truncate text-sm font-medium text-fg">
                {[chairman.honorific, chairman.name].filter(Boolean).join(" ")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong bg-paper-100 text-paper-500"
            >
              <MapPin className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                Chairman
              </p>
              <p className="truncate text-sm text-fg-subtle">Profile pending</p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border-subtle pt-3.5 text-[0.8125rem]">
          <div>
            <dt className="text-fg-subtle">
              {isLga ? "LCDAs" : "Parent LGA"}
            </dt>
            <dd className="tnum font-medium text-fg">
              {isLga
                ? (council.lcdaSlugs.length || "—")
                : (parentName ?? "—")}
            </dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Wards</dt>
            <dd className="tnum font-medium text-fg">
              {council.wardCount ?? "—"}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

/** Dense list row used inside LGA pages to list their LCDAs. */
export function CouncilRow({
  council,
  chairman,
  className,
}: {
  council: Council;
  chairman?: CouncilOfficial;
  className?: string;
}) {
  const isLga = council.councilType === "LGA";
  const href = `/${isLga ? "lgas" : "lcdas"}/${council.slug}`;

  return (
    <li
      className={cn(
        "group relative flex items-center justify-between gap-4 border-b border-border-subtle py-3.5 last:border-b-0",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="font-display text-base leading-snug text-fg">
          <CardLink href={href}>{council.name}</CardLink>
        </h3>
        <p className="mt-0.5 truncate text-[0.8125rem] text-fg-subtle">
          {chairman
            ? `${chairman.councilRole}: ${[chairman.honorific, chairman.name].filter(Boolean).join(" ")}`
            : "Chairman profile pending"}
        </p>
      </div>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 text-paper-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-700"
      />
    </li>
  );
}
