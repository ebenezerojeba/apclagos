import type { Milestone } from "@/types/content";

/**
 * Institutional copy for the About page.
 *
 * The milestones below are matters of public record. The mission, vision and
 * principle statements are marked NEEDS-VERIFICATION: replace them with the
 * chapter's own approved wording before launch rather than treating this text
 * as official party doctrine.
 */

export const aboutIntro = {
  eyebrow: "About the chapter",
  title: "The All Progressives Congress, Lagos State Chapter",
  lede: "APC Lagos is the state chapter of the All Progressives Congress. It organises the party across 20 Local Government Areas, 37 Local Council Development Areas and every ward in Lagos State, and coordinates the party's representation in the Senate, the House of Representatives and the Lagos State House of Assembly.",
  paragraphs: [
    "The chapter's work runs on two tracks. The first is organisational: maintaining the party structure from the state executive down to ward level, running congresses, and keeping the membership register current. The second is representative: supporting the party's elected officeholders and preparing candidates for each electoral cycle.",
    "This platform is the chapter's public information service. It publishes who holds which office, how the party is organised, what is happening across the state, and where to find official documents and statements.",
  ],
};

/**
 * NEEDS-VERIFICATION — replace with the chapter's approved statements.
 * These are placeholders describing the *kind* of statement expected, not
 * official party positions.
 */
export const missionVision = {
  mission: {
    title: "Mission",
    placeholder: true,
    body: "Awaiting the chapter's approved mission statement. Replace this text in src/data/about.ts.",
  },
  vision: {
    title: "Vision",
    placeholder: true,
    body: "Awaiting the chapter's approved vision statement. Replace this text in src/data/about.ts.",
  },
  values: {
    title: "Guiding principles",
    placeholder: true,
    items: [
      "Awaiting the chapter's approved statement of principles.",
      "Replace these entries in src/data/about.ts.",
    ],
  },
};

/**
 * Milestones of public record. Confirm wording with the chapter's records office
 * before launch; add Lagos-specific chapter milestones as they are supplied.
 */
export const milestones: Milestone[] = [
  {
    id: "2013-merger",
    year: "2013",
    title: "The party is formed",
    description:
      "The All Progressives Congress is formed through the merger of the Action Congress of Nigeria, the Congress for Progressive Change, the All Nigeria Peoples Party and a faction of the All Progressives Grand Alliance. The Independent National Electoral Commission registers the party in July 2013.",
  },
  {
    id: "2015-general-election",
    year: "2015",
    title: "First national mandate",
    description:
      "The APC wins the presidential election and majorities in both chambers of the National Assembly, the first time an opposition party takes power from an incumbent government at the federal level in Nigeria.",
  },
  {
    id: "2019-second-term",
    year: "2019",
    title: "Mandate renewed",
    description:
      "The party is returned at the federal level and retains the governorship of Lagos State at the general election.",
  },
  {
    id: "2023-general-election",
    year: "2023",
    title: "A Lagos leader elected President",
    description:
      "Bola Ahmed Tinubu, a former Governor of Lagos State, is elected President of the Federal Republic of Nigeria on the platform of the All Progressives Congress.",
  },
  {
    id: "chapter-milestones",
    year: "Add",
    title: "Chapter milestones to be supplied",
    description:
      "Add the Lagos chapter's own milestones — congresses, leadership transitions, membership drives and organisational reforms — in src/data/about.ts.",
  },
];

/** Short institutional facts rendered as a definition list on the About page. */
export const aboutFacts: { label: string; value: string; note?: string }[] = [
  { label: "Party", value: "All Progressives Congress" },
  { label: "Chapter", value: "Lagos State" },
  { label: "Party founded", value: "2013" },
  { label: "Local Government Areas", value: "20" },
  { label: "Local Council Development Areas", value: "37" },
  { label: "Senatorial districts", value: "3" },
  { label: "Federal constituencies", value: "24" },
  { label: "State constituencies", value: "40" },
  {
    label: "State secretariat",
    value: "Address to be supplied",
    note: "Update in src/data/site.ts",
  },
];
