/**
 * Verifies the LASIEC ward register against the mapped application data.
 *
 *   npm run verify:wards
 *
 * The register is ground truth: 57 councils, 376 wards, 13,325 polling units,
 * already cross-validated against LASIEC's own summary. What this checks is
 * that the *mapping* preserved it — that classifying 57 flat entries into 20
 * LGAs and 37 LCDAs, reconciling three council spellings, and attaching every
 * ward to a council did not drop, duplicate or misfile anything.
 *
 * It exists because the failure mode is silent. A ward attached to a council
 * slug that does not exist does not throw; it simply never appears on any page,
 * and no one notices until someone goes looking for their own ward.
 */

import { wards, councilWardStats, wardTotals, declaredTotals } from "../src/data/wards.ts";
import { lgas, lcdas, senatorialDistricts } from "../src/data/geography.ts";
import { wards as exportedWards } from "../src/data/resources.ts";

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(52)} ${actual}${ok ? "" : `  (expected ${expected})`}`);
}

function assert(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
}

/* -- The three totals the register declares --------------------------------- */

console.log("\nRegister totals, after mapping");
check("council entries", wardTotals.councils, declaredTotals.lga_lcda_count);
check("wards", wardTotals.wards, declaredTotals.ward_count);
check("polling units", wardTotals.pollingUnits, declaredTotals.polling_unit_count);

/* -- The tier split --------------------------------------------------------- */

console.log("\nClassification");
check("base LGAs", wardTotals.lgas, 20);
check("LCDAs", wardTotals.lcdas, 37);
check("LGAs in geography.ts", lgas.length, 20);
check("LCDAs in geography.ts", lcdas.length, 37);

/* -- Every ward resolves to a council that exists ---------------------------- */

console.log("\nReferential integrity");
const lgaSlugs = new Set(lgas.map((l) => l.slug));
const lcdaSlugs = new Set(lcdas.map((l) => l.slug));

const orphanLga = wards.filter((w) => !lgaSlugs.has(w.lgaSlug));
assert(
  "every ward's lgaSlug names a real LGA",
  orphanLga.length === 0,
  orphanLga.length ? `${orphanLga.length} orphans: ${[...new Set(orphanLga.map((w) => w.lgaSlug))].join(", ")}` : "",
);

const orphanLcda = wards.filter((w) => w.lcdaSlug && !lcdaSlugs.has(w.lcdaSlug));
assert(
  "every ward's lcdaSlug names a real LCDA",
  orphanLcda.length === 0,
  orphanLcda.length ? `${orphanLcda.length} orphans: ${[...new Set(orphanLcda.map((w) => w.lcdaSlug))].join(", ")}` : "",
);

// An LCDA ward must hang off its own LCDA's parent, or the ward directory files
// it under the wrong local government.
const misparented = wards.filter((w) => {
  if (!w.lcdaSlug) return false;
  const lcda = lcdas.find((l) => l.slug === w.lcdaSlug);
  return lcda?.parentLgaSlug !== w.lgaSlug;
});
assert(
  "every LCDA ward's lgaSlug is that LCDA's parent",
  misparented.length === 0,
  misparented.length ? `${misparented.length} mismatched` : "",
);

const councilSlugs = new Set(councilWardStats.map((c) => c.slug));
const councilsWithoutWards = [...lgaSlugs, ...lcdaSlugs].filter((s) => !councilSlugs.has(s));
assert(
  "every council in geography.ts appears in the register",
  councilsWithoutWards.length === 0,
  councilsWithoutWards.length ? `missing: ${councilsWithoutWards.join(", ")}` : "",
);

const registerWithoutCouncil = councilWardStats
  .map((c) => c.slug)
  .filter((s) => !lgaSlugs.has(s) && !lcdaSlugs.has(s));
assert(
  "every register council exists in geography.ts",
  registerWithoutCouncil.length === 0,
  registerWithoutCouncil.length ? `missing: ${registerWithoutCouncil.join(", ")}` : "",
);

/* -- Uniqueness ------------------------------------------------------------- */

console.log("\nUniqueness");
const slugs = wards.map((w) => w.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
assert("ward slugs are unique", dupes.length === 0, dupes.length ? dupes.slice(0, 5).join(", ") : "");
assert("ward ids are unique", new Set(wards.map((w) => w.id)).size === wards.length);

/* -- Per-council counts survived the mapping -------------------------------- */

console.log("\nPer-council counts");
let countMismatches = 0;
for (const stats of councilWardStats) {
  const owned = wards.filter((w) => (w.lcdaSlug ?? w.lgaSlug) === stats.slug);
  const pu = owned.reduce((sum, w) => sum + (w.pollingUnits ?? 0), 0);
  if (owned.length !== stats.wardCount || pu !== stats.pollingUnitCount) {
    countMismatches += 1;
    console.log(`     x ${stats.slug}: ${owned.length}/${stats.wardCount} wards, ${pu}/${stats.pollingUnitCount} units`);
  }
}
assert("all 57 councils keep their own ward and polling-unit counts", countMismatches === 0);

// The counts attached to the geography records must agree too.
const attachedWards =
  lgas.reduce((s, l) => s + (l.wardCount ?? 0), 0) + lcdas.reduce((s, l) => s + (l.wardCount ?? 0), 0);
const attachedUnits =
  lgas.reduce((s, l) => s + (l.pollingUnitCount ?? 0), 0) +
  lcdas.reduce((s, l) => s + (l.pollingUnitCount ?? 0), 0);
check("wardCount attached across geography records", attachedWards, declaredTotals.ward_count);
check("pollingUnitCount attached across geography records", attachedUnits, declaredTotals.polling_unit_count);

/* -- What the pages actually consume ---------------------------------------- */

console.log("\nWhat the pages read");
check("resources.ts re-exports every ward", exportedWards.length, declaredTotals.ward_count);
const lgasWithWards = new Set(wards.map((w) => w.lgaSlug)).size;
check("LGAs with at least one ward (the /wards grouping)", lgasWithWards, 20);
const lcdasWithWards = new Set(wards.filter((w) => w.lcdaSlug).map((w) => w.lcdaSlug)).size;
check("LCDAs with at least one ward", lcdasWithWards, 37);

/* -- Senatorial districts still partition the state -------------------------- */

console.log("\nSenatorial districts");
const assigned = senatorialDistricts.flatMap((d) => d.lgaSlugs);
check("LGAs assigned to a district", assigned.length, 20);
assert("no LGA is in two districts", new Set(assigned).size === assigned.length);
assert(
  "Eti-Osa is in Lagos Central",
  senatorialDistricts.find((d) => d.slug === "lagos-central")?.lgaSlugs.includes("eti-osa") === true,
);

/* -- Nothing was invented ---------------------------------------------------- */

console.log("\nNothing fabricated");
assert("no ward carries an invented code", wards.every((w) => w.code === undefined));
assert(
  "no council carries an invented chairman",
  [...lgas, ...lcdas].every((c) => c.chairmanSlug === undefined && c.partyChairmanSlug === undefined),
);

/* -- Result ----------------------------------------------------------------- */

console.log(
  failures === 0
    ? "\n  All checks passed.\n"
    : `\n  ${failures} check${failures === 1 ? "" : "s"} FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
