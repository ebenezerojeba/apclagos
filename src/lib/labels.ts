import type {
  AchievementCategory,
  Chamber,
  DocumentCategory,
  ElectionOffice,
  EventCategory,
  GalleryCategory,
  LeadershipBody,
  VideoCategory,
} from "@/types/content";

/**
 * Human-readable labels for the enumerations used across the site.
 * Kept in one place so a filter chip, a page title and a breadcrumb can never
 * disagree about what something is called.
 */

export const leadershipBodyLabels: Record<LeadershipBody, string> = {
  "state-executive": "State Executive",
  "state-working-committee": "State Working Committee",
  "elders-council": "Elders Council",
  government: "In Government",
  "national-representation": "National Representation",
  "party-organ": "Party Organs",
};

export const chamberLabels: Record<Chamber, string> = {
  senate: "Senate",
  "house-of-representatives": "House of Representatives",
  "house-of-assembly": "Lagos State House of Assembly",
};

export const chamberShortLabels: Record<Chamber, string> = {
  senate: "Senate",
  "house-of-representatives": "House of Reps",
  "house-of-assembly": "House of Assembly",
};

export const chamberDescriptions: Record<Chamber, string> = {
  senate:
    "Lagos State is represented in the Senate by three senators, one for each senatorial district.",
  "house-of-representatives":
    "Lagos State returns members for 24 federal constituencies to the House of Representatives.",
  "house-of-assembly":
    "The Lagos State House of Assembly has 40 members, two from each Local Government Area.",
};

export const electionOfficeLabels: Record<ElectionOffice, string> = {
  governor: "Governor",
  "deputy-governor": "Deputy Governor",
  senate: "Senate",
  "house-of-representatives": "House of Representatives",
  "house-of-assembly": "House of Assembly",
  "local-government-chairman": "Local Government Chairman",
  councillor: "Councillor",
  other: "Other offices",
};

export const eventCategoryLabels: Record<EventCategory, string> = {
  congress: "Congress",
  rally: "Rally",
  meeting: "Meeting",
  "town-hall": "Town hall",
  commissioning: "Commissioning",
  training: "Training",
  community: "Community",
  other: "Other",
};

export const galleryCategoryLabels: Record<GalleryCategory, string> = {
  leadership: "Leadership",
  campaign: "Campaign",
  events: "Events",
  community: "Community",
  government: "Government",
  congress: "Congress",
  other: "Other",
};

export const videoCategoryLabels: Record<VideoCategory, string> = {
  campaign: "Campaign",
  interviews: "Interviews",
  events: "Events",
  speeches: "Speeches",
  documentary: "Documentary",
  activities: "Party activities",
};

export const achievementCategoryLabels: Record<AchievementCategory, string> = {
  infrastructure: "Infrastructure",
  education: "Education",
  health: "Health",
  security: "Security",
  economy: "Economy",
  transport: "Transport",
  environment: "Environment",
  social: "Social development",
  "party-organisation": "Party organisation",
};

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  constitution: "Constitution",
  policy: "Policy",
  guidelines: "Guidelines",
  forms: "Forms",
  reports: "Reports",
  press: "Press",
  manifesto: "Manifesto",
};

/** Builds `SelectOption`s from a label map and the values actually present. */
export function optionsFrom<T extends string>(
  labels: Record<T, string>,
  values: T[],
): { value: string; label: string; count: number }[] {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return (Object.keys(labels) as T[])
    .filter((key) => counts[key] > 0)
    .map((key) => ({ value: key, label: labels[key], count: counts[key] }));
}
