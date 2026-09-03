import type {
  Candidate,
  CouncilOfficial,
  HouseOfAssemblyMember,
  HouseOfRepresentativesMember,
  Leader,
  Senator,
} from "@/types/content";

/**
 * PEOPLE — authoritative records supplied by the party.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * These arrays ship EMPTY on purpose.
 *
 * No name, office, biography, photograph or electoral claim has been invented.
 * Add the party's authoritative records here (or point the data layer at an API
 * — see `src/lib/content.ts`) and every directory, profile page, filter, search
 * index, sitemap entry and structured-data block picks them up automatically.
 *
 * Until a record exists the UI renders an explicit "profile pending" state
 * rather than a fabricated placeholder person.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO ADD A PERSON
 *
 *   1. Drop the photograph into `public/images/people/` using the person's slug
 *      as the filename, e.g. `public/images/people/ade-okonkwo.jpg`.
 *      Portraits should be 3:4, at least 900x1200, face in the upper third.
 *   2. Add a record below. `slug` becomes the profile URL and must be unique
 *      within its collection.
 *   3. Nothing else. Cards, filters, search and SEO are all derived.
 *
 * WORKED EXAMPLE (copy, then replace every value):
 *
 *   {
 *     id: "ade-okonkwo",
 *     slug: "ade-okonkwo",
 *     status: "published",
 *     order: 1,
 *     kind: "leader",
 *     body: "state-executive",
 *     featured: true,
 *     honorific: "Chief",
 *     name: "Ade Okonkwo",
 *     postNominals: "OFR",
 *     position: "State Chairman",
 *     shortPosition: "State Chairman",
 *     jurisdiction: "Lagos State",
 *     summary: "One or two sentences shown on the profile card.",
 *     biography: ["First paragraph.", "Second paragraph."],
 *     portrait: {
 *       src: "/images/people/ade-okonkwo.jpg",
 *       alt: "Portrait of Chief Ade Okonkwo, State Chairman of APC Lagos",
 *       width: 900,
 *       height: 1200,
 *       focal: "top",
 *       role: "portrait",
 *     },
 *     tenureStart: "2021-07-01",
 *     education: ["Institution — qualification, year"],
 *     careerHighlights: ["Highlight one", "Highlight two"],
 *     previousPositions: ["Previous office, years"],
 *     social: { x: "https://x.com/handle" },
 *     tags: ["state executive"],
 *   }
 *
 * A machine-readable version of every template lives in `content/`.
 */

/** Party leadership: state executive, working committee, elders, government. */
export const leaders: Leader[] = [];

/**
 * Chairmen and other officials of the 20 LGAs and 37 LCDAs.
 * Link each record to its council with `councilSlug` + `councilType`; the slugs
 * are the ones generated in `src/data/geography.ts`.
 */
export const councilOfficials: CouncilOfficial[] = [];

/** Senators representing the three Lagos senatorial districts. */
export const senators: Senator[] = [];

/** Members of the House of Representatives for the 24 federal constituencies. */
export const houseOfRepresentativesMembers: HouseOfRepresentativesMember[] = [];

/** Members of the Lagos State House of Assembly for the 40 state constituencies. */
export const houseOfAssemblyMembers: HouseOfAssemblyMember[] = [];

/** Candidates, past and present. Each links to an election in `elections.ts`. */
export const candidates: Candidate[] = [];
