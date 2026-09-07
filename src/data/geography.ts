import type {
  FederalConstituency,
  LocalCouncilDevelopmentArea,
  LocalGovernmentArea,
  SenatorialDistrict,
  StateConstituency,
} from "@/types/content";
import { slugify } from "@/lib/slug";
import { wardStatsFor } from "./wards";

/**
 * The political geography of Lagos State.
 *
 * These are structural facts about how the state is organised - 20
 * constitutionally recognised Local Government Areas, 37 Local Council
 * Development Areas created by the state (57 local councils in total), 3
 * senatorial districts, 24 federal constituencies and 40 state constituencies.
 *
 * Nothing here names a person or claims an electoral outcome. Officeholders are
 * linked in separately from the CMS (see `src/lib/cms.ts`) so this file rarely needs
 * to change.
 *
 * NEEDS-VERIFICATION markers below flag the two places where delimitation
 * detail should be confirmed against current INEC publications before launch:
 *   1. per-LGA ward counts (deliberately left empty rather than guessed)
 *   2. the state-constituency -> federal-constituency mapping
 */

const NOW = "2026-01-01";

function base<T extends string>(name: T, order: number) {
  return {
    id: slugify(name),
    slug: slugify(name),
    status: "published" as const,
    order,
    updatedAt: NOW,
  };
}

/* -------------------------------------------------------------------------- */
/*  Senatorial districts                                                       */
/* -------------------------------------------------------------------------- */

const DISTRICT_TABLE: { name: string; lgas: string[]; description: string }[] = [
  {
    name: "Lagos Central",
    // Eti-Osa sits here, not in Lagos East. Corrected against the LASIEC ward
    // register, which files Eti-Osa, Eti-Osa East and Iru-Victoria Island under
    // LAGOS CENTRAL; the previous grouping put all three in the wrong district.
    lgas: ["Apapa", "Eti-Osa", "Lagos Island", "Lagos Mainland", "Surulere"],
    description:
      "The commercial and administrative core of the state, covering the island business district, the port city of Apapa and the mainland's oldest neighbourhoods.",
  },
  {
    name: "Lagos East",
    lgas: ["Epe", "Ibeju-Lekki", "Ikorodu", "Kosofe", "Shomolu"],
    description:
      "The state's fastest-growing corridor, stretching from Kosofe and Shomolu through Ikorodu to the Lekki-Epe development axis.",
  },
  {
    name: "Lagos West",
    lgas: [
      "Agege",
      "Ajeromi-Ifelodun",
      "Alimosho",
      "Amuwo-Odofin",
      "Badagry",
      "Ifako-Ijaiye",
      "Ikeja",
      "Mushin",
      "Ojo",
      "Oshodi-Isolo",
    ],
    description:
      "The most populous district, spanning the state capital at Ikeja, the dense western suburbs and the international border corridor at Badagry.",
  },
];

export const senatorialDistricts: SenatorialDistrict[] = DISTRICT_TABLE.map(
  (d, i) => ({
    ...base(d.name, i),
    name: `${d.name} Senatorial District`,
    slug: slugify(d.name),
    id: slugify(d.name),
    lgaSlugs: d.lgas.map(slugify),
    description: d.description,
  }),
);

/* -------------------------------------------------------------------------- */
/*  Federal constituencies (24)                                                */
/* -------------------------------------------------------------------------- */

/** `[federal constituency name, LGA names it covers]` */
const FEDERAL_TABLE: [string, string[]][] = [
  // Lagos Central
  ["Apapa", ["Apapa"]],
  ["Lagos Island I", ["Lagos Island"]],
  ["Lagos Island II", ["Lagos Island"]],
  ["Lagos Mainland", ["Lagos Mainland"]],
  ["Surulere I", ["Surulere"]],
  ["Surulere II", ["Surulere"]],
  // Lagos East
  ["Epe", ["Epe"]],
  ["Eti-Osa", ["Eti-Osa"]],
  ["Ibeju-Lekki", ["Ibeju-Lekki"]],
  ["Ikorodu", ["Ikorodu"]],
  ["Kosofe", ["Kosofe"]],
  ["Shomolu", ["Shomolu"]],
  // Lagos West
  ["Agege", ["Agege"]],
  ["Ajeromi-Ifelodun", ["Ajeromi-Ifelodun"]],
  ["Alimosho", ["Alimosho"]],
  ["Amuwo-Odofin", ["Amuwo-Odofin"]],
  ["Badagry", ["Badagry"]],
  ["Ifako-Ijaiye", ["Ifako-Ijaiye"]],
  ["Ikeja", ["Ikeja"]],
  ["Mushin I", ["Mushin"]],
  ["Mushin II", ["Mushin"]],
  ["Ojo", ["Ojo"]],
  ["Oshodi-Isolo I", ["Oshodi-Isolo"]],
  ["Oshodi-Isolo II", ["Oshodi-Isolo"]],
];

function districtForLga(lgaName: string): string {
  const match = DISTRICT_TABLE.find((d) => d.lgas.includes(lgaName));
  if (!match) {
    throw new Error(`No senatorial district configured for LGA "${lgaName}"`);
  }
  return slugify(match.name);
}

export const federalConstituencies: FederalConstituency[] = FEDERAL_TABLE.map(
  ([name, lgas], i) => ({
    ...base(name, i),
    name: `${name} Federal Constituency`,
    senatorialDistrictSlug: districtForLga(lgas[0]),
    lgaSlugs: lgas.map(slugify),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Local Government Areas (20)                                                */
/* -------------------------------------------------------------------------- */

const LGA_NAMES = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
] as const;

/* -------------------------------------------------------------------------- */
/*  State constituencies (40 - two per LGA)                                    */
/* -------------------------------------------------------------------------- */

/**
 * NEEDS-VERIFICATION: where an LGA carries two federal constituencies the state
 * constituencies are paired I->I and II->II. Confirm against INEC delimitation
 * before publishing the constituency explorer.
 */
function federalSlugForStateConstituency(lga: string, index: 1 | 2): string {
  const split = FEDERAL_TABLE.filter(([, lgas]) => lgas[0] === lga);
  if (split.length === 2) return slugify(split[index - 1][0]);
  return slugify(split[0][0]);
}

export const stateConstituencies: StateConstituency[] = LGA_NAMES.flatMap(
  (lga, lgaIndex) =>
    ([1, 2] as const).map((n) => {
      const name = `${lga} Constituency ${n === 1 ? "I" : "II"}`;
      return {
        ...base(name, lgaIndex * 2 + n),
        name,
        federalConstituencySlug: federalSlugForStateConstituency(lga, n),
        lgaSlug: slugify(lga),
      } satisfies StateConstituency;
    }),
);

/* -------------------------------------------------------------------------- */
/*  Local Council Development Areas (37)                                       */
/* -------------------------------------------------------------------------- */

/**
 * `[LCDA name, parent LGA name]`
 *
 * Reconciled against the LASIEC ward register, which is the authority here.
 * That register lists Ifelodun (code 02B, under Ajeromi-Ifelodun) and
 * Ikoyi-Obalende (08C, under Eti-Osa); it has no entry for Ajeromi or Ibeju,
 * which this table previously carried and which held no wards. The count is
 * unchanged at 37 either way.
 */
const LCDA_TABLE: [string, string][] = [
  ["Agbado/Oke-Odo", "Alimosho"],
  ["Agboyi-Ketu", "Kosofe"],
  ["Apapa-Iganmu", "Apapa"],
  ["Ayobo-Ipaja", "Alimosho"],
  ["Badagry West", "Badagry"],
  ["Bariga", "Shomolu"],
  ["Coker-Aguda", "Surulere"],
  ["Egbe-Idimu", "Alimosho"],
  ["Ejigbo", "Oshodi-Isolo"],
  ["Eredo", "Epe"],
  ["Eti-Osa East", "Eti-Osa"],
  ["Iba", "Ojo"],
  ["Ifelodun", "Ajeromi-Ifelodun"],
  ["Igando-Ikotun", "Alimosho"],
  ["Igbogbo-Baiyeku", "Ikorodu"],
  ["Ijede", "Ikorodu"],
  ["Ikorodu North", "Ikorodu"],
  ["Ikorodu West", "Ikorodu"],
  ["Ikosi-Ejinrin", "Epe"],
  ["Ikosi-Isheri", "Kosofe"],
  ["Ikoyi-Obalende", "Eti-Osa"],
  ["Imota", "Ikorodu"],
  ["Iru-Victoria Island", "Eti-Osa"],
  ["Isolo", "Oshodi-Isolo"],
  ["Itire-Ikate", "Surulere"],
  ["Lagos Island East", "Lagos Island"],
  ["Lekki", "Ibeju-Lekki"],
  ["Mosan-Okunola", "Alimosho"],
  ["Odi-Olowo/Ojuwoye", "Mushin"],
  ["Ojodu", "Ikeja"],
  ["Ojokoro", "Ifako-Ijaiye"],
  ["Olorunda", "Badagry"],
  ["Onigbongbo", "Ikeja"],
  ["Oriade", "Amuwo-Odofin"],
  ["Orile-Agege", "Agege"],
  ["Oto-Awori", "Ojo"],
  ["Yaba", "Lagos Mainland"],
];

export const lcdas: LocalCouncilDevelopmentArea[] = LCDA_TABLE.map(
  ([name, parent], i) => {
    const stats = wardStatsFor(slugify(name));
    return {
      ...base(name, i),
      name,
      councilType: "LCDA" as const,
      parentLgaSlug: slugify(parent),
      wardCount: stats?.wardCount,
      pollingUnitCount: stats?.pollingUnitCount,
      lasiecCode: stats?.lasiecCode,
    };
  },
);

export const lgas: LocalGovernmentArea[] = LGA_NAMES.map((name, i) => ({
  ...base(name, i),
  name,
  councilType: "LGA" as const,
  lcdaSlugs: LCDA_TABLE.filter(([, parent]) => parent === name).map(([lcda]) =>
    slugify(lcda),
  ),
  senatorialDistrictSlug: districtForLga(name),
  federalConstituencySlugs: FEDERAL_TABLE.filter(
    ([, covered]) => covered[0] === name,
  ).map(([fc]) => slugify(fc)),
  stateConstituencySlugs: [
    slugify(`${name} Constituency I`),
    slugify(`${name} Constituency II`),
  ],
  // Ward and polling-unit counts come from the LASIEC register in
  // src/data/wards.ts. These are the council's OWN wards, not the wards of the
  // LCDAs carved out of it - the LCDAs carry their own counts.
  wardCount: wardStatsFor(slugify(name))?.wardCount,
  pollingUnitCount: wardStatsFor(slugify(name))?.pollingUnitCount,
  lasiecCode: wardStatsFor(slugify(name))?.lasiecCode,
}));

/* -------------------------------------------------------------------------- */
/*  Aggregate counts - referenced by the homepage statistics band              */
/* -------------------------------------------------------------------------- */

export const geographyCounts = {
  lgas: lgas.length,
  lcdas: lcdas.length,
  councils: lgas.length + lcdas.length,
  senatorialDistricts: senatorialDistricts.length,
  federalConstituencies: federalConstituencies.length,
  stateConstituencies: stateConstituencies.length,
} as const;
