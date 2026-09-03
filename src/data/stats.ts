import type { StatItem } from "@/types/content";
import { geographyCounts } from "@/data/geography";
import { leaders } from "@/data/people";
import { wards } from "@/data/resources";

/**
 * Headline figures for the homepage band and the About page.
 *
 * Every value is either derived from the structural data in `src/data` or, where
 * it comes from an external register, carries a `note` recording its source so
 * the figure stays attributable. Derived counts that are still zero are filtered
 * out rather than rendered as an empty statistic.
 */

/**
 * NEEDS-VERIFICATION: total INEC-delimited wards in Lagos State. Confirm the
 * current figure against INEC's delimitation register, then load the per-LGA
 * breakdown into `src/data/resources.ts`.
 */
const DELIMITED_WARD_TOTAL = 245;

export function getHeadlineStats(): StatItem[] {
  const items: StatItem[] = [
    {
      id: "councils",
      label: "Local councils",
      value: geographyCounts.councils,
      description: "20 LGAs and 37 LCDAs across Lagos State",
      href: "/councils",
    },
    {
      id: "lcdas",
      label: "LCDAs",
      value: geographyCounts.lcdas,
      description: "Local Council Development Areas",
      href: "/lcdas",
    },
    {
      id: "lgas",
      label: "Local Government Areas",
      value: geographyCounts.lgas,
      description: "Constitutionally recognised LGAs",
      href: "/lgas",
    },
    {
      id: "state-constituencies",
      label: "State constituencies",
      value: geographyCounts.stateConstituencies,
      description: "Seats in the Lagos State House of Assembly",
      href: "/representatives/house-of-assembly",
    },
    {
      id: "federal-constituencies",
      label: "Federal constituencies",
      value: geographyCounts.federalConstituencies,
      description: "Lagos seats in the House of Representatives",
      href: "/representatives/house-of-representatives",
    },
    {
      id: "senatorial-districts",
      label: "Senatorial districts",
      value: geographyCounts.senatorialDistricts,
      description: "Lagos Central, Lagos East and Lagos West",
      href: "/representatives/senate",
    },
    {
      id: "wards",
      label: "Political wards",
      value: wards.length > 0 ? wards.length : DELIMITED_WARD_TOTAL,
      description: "Ward-level delimitation across the state",
      href: "/wards",
      note:
        wards.length > 0
          ? undefined
          : "Figure pending confirmation against the current INEC register.",
    },
    {
      id: "executives",
      label: "Party executives",
      value: leaders.length,
      description: "Published leadership profiles",
      href: "/leadership",
    },
  ];

  return items.filter((item) => item.value > 0);
}

/** The four figures used in the compact homepage hero strip. */
export function getHeroStats(): StatItem[] {
  const wanted = ["councils", "state-constituencies", "federal-constituencies", "wards"];
  const all = getHeadlineStats();
  return wanted
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is StatItem => Boolean(s));
}
