import raw from "./lagos-wards.json";
import type { Ward } from "@/types/content";

/**
 * The LASIEC ward register, mapped onto this application's council model.
 *
 * `lagos-wards.json` is the supplied dataset, stored verbatim and treated as
 * ground truth: 57 councils, 376 wards, 13,325 polling units, already
 * cross-validated against LASIEC's own summary totals. Nothing here re-derives,
 * re-estimates or corrects a name or a count — this module only classifies and
 * re-shapes.
 *
 * Two things need reconciling, and both are done explicitly rather than by
 * inference at read time:
 *
 *  1. **Tier.** The dataset is a flat list of 57 administrative councils. This
 *     application models the 20 INEC local government areas and the 37 LCDAs
 *     carved out of them as separate concepts, because they are: an LCDA has a
 *     parent, an LGA has constituencies. The dataset's `code` field carries
 *     that structure — see `parentIndexFromCode`.
 *
 *  2. **Naming.** Three councils appear under a different spelling here than in
 *     `geography.ts`. See `COUNCIL_SLUG_OVERRIDES`.
 */

/* -------------------------------------------------------------------------- */
/*  Naming reconciliation                                                      */
/* -------------------------------------------------------------------------- */

/**
 * LASIEC slug -> the slug this repository already publishes that council under.
 *
 * All three are the same council under a different transliteration or
 * punctuation, not a different place. The repository's spelling wins because it
 * is already load-bearing: `/lgas/shomolu`, `/lgas/ikorodu` and
 * `/lcdas/odi-olowo-ojuwoye` are live URLs, and records in the database already
 * carry `ikorodu` and `shomolu` in their `lgaSlug`. Renaming the councils to
 * match the dataset would silently detach every one of those records from its
 * council — the exact failure this mapping exists to prevent.
 *
 * Ward slugs are deliberately NOT rewritten to match. They are supplied
 * identifiers, they are unique, and nothing resolves a ward by taking its
 * council's slug as a prefix. So `somolu-onipanu` stays `somolu-onipanu` while
 * its council is `shomolu`; the mismatch is cosmetic and confined to an id.
 */
const COUNCIL_SLUG_OVERRIDES: Record<string, string> = {
  somolu: "shomolu",
  "ikorodu-central": "ikorodu",
  "odiolowo-ojuwoye": "odi-olowo-ojuwoye",
};

function councilSlug(datasetSlug: string): string {
  return COUNCIL_SLUG_OVERRIDES[datasetSlug] ?? datasetSlug;
}

/* -------------------------------------------------------------------------- */
/*  Tier and parent, read out of the LASIEC code                               */
/* -------------------------------------------------------------------------- */

interface RawWard {
  name: string;
  slug: string;
  polling_units: number;
}

interface RawCouncil {
  name: string;
  slug: string;
  code: string | null;
  senatorial_district: string;
  ward_count: number;
  polling_unit_count: number;
  wards: RawWard[];
}

const councils = (raw as { lgas: RawCouncil[] }).lgas;

/**
 * A LASIEC code is `<two-digit index><letter>`: the index identifies the base
 * local government area by its position in alphabetical order, and the letter
 * distinguishes the base LGA (`A`, or no code at all) from the LCDAs carved out
 * of it (`B`, `C`, `D`, `E`, `F`).
 *
 * This is a reading of the supplied data, not an assumption about it. It was
 * checked against the 34 LCDAs whose parent `geography.ts` records independently
 * and by hand: 34 agreed, none disagreed. It also produces exactly 20 base
 * councils and exactly 37 carved ones, which is the split this application
 * already models. `scripts/verify-wards.mjs` re-runs both checks.
 */
function parentIndexFromCode(code: string | null): number | null {
  if (!code) return null;
  const letter = code.slice(2);
  if (letter === "A") return null;
  return Number(code.slice(0, 2));
}

/** The 20 base councils, in the alphabetical order the codes index into. */
const baseCouncils = councils
  .filter((council) => parentIndexFromCode(council.code) === null)
  .sort((a, b) => a.name.localeCompare(b.name));

function parentSlugOf(council: RawCouncil): string | undefined {
  const index = parentIndexFromCode(council.code);
  if (index === null) return undefined;
  const parent = baseCouncils[index - 1];
  return parent ? councilSlug(parent.slug) : undefined;
}

/* -------------------------------------------------------------------------- */
/*  Public shape                                                               */
/* -------------------------------------------------------------------------- */

export interface CouncilWardStats {
  /** The slug this application publishes the council under. */
  slug: string;
  /** The council's name exactly as LASIEC records it. */
  lasiecName: string;
  /** LASIEC's field-operations code. Absent for most base LGAs. */
  lasiecCode?: string;
  tier: "LGA" | "LCDA";
  /** Set for an LCDA only. */
  parentLgaSlug?: string;
  wardCount: number;
  pollingUnitCount: number;
}

export const councilWardStats: CouncilWardStats[] = councils.map((council) => {
  const parentLgaSlug = parentSlugOf(council);
  return {
    slug: councilSlug(council.slug),
    lasiecName: council.name,
    lasiecCode: council.code ?? undefined,
    tier: parentLgaSlug ? "LCDA" : "LGA",
    parentLgaSlug,
    wardCount: council.ward_count,
    pollingUnitCount: council.polling_unit_count,
  };
});

const statsBySlug = new Map(councilWardStats.map((entry) => [entry.slug, entry]));

/** Ward counts and polling-unit counts for one council, or `undefined`. */
export function wardStatsFor(slug: string): CouncilWardStats | undefined {
  return statsBySlug.get(slug);
}

/**
 * Every ward, flattened.
 *
 * `lgaSlug` is always the base local government area — for a ward inside an
 * LCDA that is the LCDA's parent, not the LCDA — because `Ward.lgaSlug` is
 * required and the ward directory groups by it. `lcdaSlug` is set in addition
 * whenever the ward sits inside a carved council, which is what
 * `/lcdas/[slug]` filters on.
 *
 * `code` is left unset. The dataset's `code` identifies the *council*, not the
 * ward, and no per-ward code was supplied — inventing one would put a number
 * on a page that no register backs.
 */
export const wards: Ward[] = councils.flatMap((council) => {
  const slug = councilSlug(council.slug);
  const parentLgaSlug = parentSlugOf(council);

  return council.wards.map((ward, index) => ({
    id: ward.slug,
    slug: ward.slug,
    status: "published" as const,
    order: index,
    name: ward.name,
    lgaSlug: parentLgaSlug ?? slug,
    ...(parentLgaSlug ? { lcdaSlug: slug } : {}),
    pollingUnits: ward.polling_units,
  }));
});

/** The dataset's own declared totals, for verification against the mapping. */
export const declaredTotals = (raw as {
  totals: { lga_lcda_count: number; ward_count: number; polling_unit_count: number };
}).totals;

export const wardTotals = {
  councils: councilWardStats.length,
  lgas: councilWardStats.filter((c) => c.tier === "LGA").length,
  lcdas: councilWardStats.filter((c) => c.tier === "LCDA").length,
  wards: wards.length,
  pollingUnits: wards.reduce((sum, ward) => sum + (ward.pollingUnits ?? 0), 0),
} as const;
