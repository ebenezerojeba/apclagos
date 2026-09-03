import type { Election } from "@/types/content";

/**
 * Election cycles. A candidate record joins to one of these via `electionSlug`.
 *
 * Only the cycle itself is described here — no candidate, result or projection
 * is asserted. `date` stays undefined until INEC publishes the polling date.
 */
export const elections: Election[] = [
  {
    id: "2027",
    slug: "2027",
    status: "published",
    order: 0,
    name: "2027 General Election",
    year: 2027,
    phase: "upcoming",
    // date: NEEDS-VERIFICATION — set once INEC publishes the timetable.
    summary:
      "Nigeria's next general election cycle, covering the presidential and National Assembly polls followed by the governorship and State House of Assembly polls.",
    description: [
      "APC Lagos will field candidates across every office contested in Lagos State. Candidate profiles are published on this page as each nomination is confirmed by the party and filed with the Independent National Electoral Commission.",
      "Constituency information, ward delimitation and voter guidance will be added here as the electoral timetable is released.",
    ],
    offices: [
      "governor",
      "deputy-governor",
      "senate",
      "house-of-representatives",
      "house-of-assembly",
    ],
  },
];

export const currentElectionSlug = "2027";
