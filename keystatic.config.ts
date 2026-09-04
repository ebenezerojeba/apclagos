import { collection, config, fields } from "@keystatic/core";
import {
  federalConstituencies,
  lcdas,
  lgas,
  senatorialDistricts,
  stateConstituencies,
} from "@/data/geography";
import { elections } from "@/data/elections";
import {
  electionOfficeLabels,
  leadershipBodyLabels,
} from "@/lib/labels";

/**
 * Keystatic — the editing interface for party records.
 *
 * Content is stored as JSON in `content/people/**` and committed to the repo,
 * so every change to who holds an office is a commit with an author and a
 * timestamp. For a political directory that audit trail is worth more than
 * instant saves.
 *
 * Storage mode is chosen by environment, and the choice matters:
 *
 *   local  — writes straight to the working tree, with NO authentication.
 *            Development only. Shipping this to production would hand anyone
 *            who found the URL write access to the site's content.
 *   github — commits through the GitHub API. Editors sign in with GitHub and
 *            authorisation is the repository's own collaborator list, so
 *            granting or revoking access is a GitHub permission change.
 *
 * Every dropdown below is generated from `src/data/geography.ts`, so an editor
 * picks "Ikeja Constituency I" from a list rather than typing a slug that has
 * to match exactly. A mistyped slug is the one error that would silently
 * detach a person from their seat.
 */

const isDev = process.env.NODE_ENV === "development";

const githubRepo = {
  owner: process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER ?? "",
  name: process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO ?? "",
};

/** Sorted `{ label, value }` options for a select. */
function options(items: { slug: string; name: string }[], strip?: RegExp) {
  return items
    .map((item) => ({
      label: strip ? item.name.replace(strip, "") : item.name,
      value: item.slug,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const districtOptions = options(senatorialDistricts, / Senatorial District$/);
const federalOptions = options(federalConstituencies, / Federal Constituency$/);
const stateOptions = options(stateConstituencies);
const lgaOptions = options(lgas);
const councilOptions = [
  ...lgas.map((l) => ({ label: `${l.name} (LGA)`, value: l.slug })),
  ...lcdas.map((l) => ({ label: `${l.name} (LCDA)`, value: l.slug })),
].sort((a, b) => a.label.localeCompare(b.label));

const labelOptions = <T extends string>(map: Record<T, string>) =>
  (Object.keys(map) as T[]).map((value) => ({ label: map[value], value }));

/* -------------------------------------------------------------------------- */
/*  Shared person schema                                                       */
/* -------------------------------------------------------------------------- */

const statusField = fields.select({
  label: "Status",
  description:
    "Only published records appear on the public site. Use draft to prepare a profile before it goes live.",
  options: [
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ],
  defaultValue: "draft",
});

const portraitFields = {
  portrait: fields.image({
    label: "Photograph",
    description:
      "Portrait orientation, 3:4, at least 900x1200. Face in the upper third — cards crop to a fixed shape.",
    directory: "public/images/people",
    publicPath: "/images/people/",
  }),
  portraitAlt: fields.text({
    label: "Photograph description",
    description:
      "Describe the photograph for screen readers, e.g. “Portrait of Hon. Ada Okoye, Member for Ikeja Constituency I”.",
    validation: { isRequired: false },
  }),
  portraitFocal: fields.select({
    label: "Keep in frame",
    description: "Which part of the photograph must never be cropped away.",
    options: [
      { label: "Top (usual for portraits)", value: "top" },
      { label: "Centre", value: "center" },
      { label: "Bottom", value: "bottom" },
    ],
    defaultValue: "top",
  }),
};

/** The fields every kind of person shares. */
function personFields() {
  return {
    name: fields.slug({
      name: {
        label: "Full name",
        description: "Given and family name only — titles go in the field below.",
        validation: { isRequired: true },
      },
      slug: {
        label: "URL slug",
        description:
          "The web address for this profile. Changing it changes a public URL.",
      },
    }),
    status: statusField,
    honorific: fields.text({
      label: "Title",
      description: "e.g. Hon., Sen., Rt. Hon., Chief, Dr.",
      validation: { isRequired: false },
    }),
    postNominals: fields.text({
      label: "Post-nominals",
      description: "e.g. SAN, OFR, MFR.",
      validation: { isRequired: false },
    }),
    position: fields.text({
      label: "Position",
      description: "The office held, e.g. “Member, Lagos State House of Assembly”.",
      validation: { isRequired: true },
    }),
    shortPosition: fields.text({
      label: "Short position",
      description: "Optional compact label used where space is tight.",
      validation: { isRequired: false },
    }),
    jurisdiction: fields.text({
      label: "Jurisdiction",
      description:
        "The area served, as it should read on the profile, e.g. “Ikeja Constituency I”.",
      validation: { isRequired: false },
    }),
    summary: fields.text({
      label: "Summary",
      description: "One or two sentences. Shown on the profile card.",
      multiline: true,
      validation: { isRequired: false },
    }),
    ...portraitFields,
    biography: fields.array(
      fields.text({ label: "Paragraph", multiline: true }),
      {
        label: "Biography",
        description: "One entry per paragraph.",
        itemLabel: (props) => props.value.slice(0, 60) || "Paragraph",
      },
    ),
    careerHighlights: fields.array(fields.text({ label: "Highlight" }), {
      label: "Political experience",
      itemLabel: (props) => props.value || "Highlight",
    }),
    previousPositions: fields.array(fields.text({ label: "Position" }), {
      label: "Previous positions",
      itemLabel: (props) => props.value || "Position",
    }),
    committees: fields.array(fields.text({ label: "Committee" }), {
      label: "Committees",
      itemLabel: (props) => props.value || "Committee",
    }),
    education: fields.array(fields.text({ label: "Qualification" }), {
      label: "Education",
      itemLabel: (props) => props.value || "Qualification",
    }),
    tenureStart: fields.date({
      label: "In office since",
      validation: { isRequired: false },
    }),
    social: fields.object(
      {
        x: fields.url({ label: "X", validation: { isRequired: false } }),
        facebook: fields.url({ label: "Facebook", validation: { isRequired: false } }),
        instagram: fields.url({ label: "Instagram", validation: { isRequired: false } }),
        linkedin: fields.url({ label: "LinkedIn", validation: { isRequired: false } }),
      },
      { label: "Social channels" },
    ),
    email: fields.text({ label: "Office email", validation: { isRequired: false } }),
    phone: fields.text({ label: "Office telephone", validation: { isRequired: false } }),
    order: fields.integer({
      label: "Sort order",
      description: "Lower numbers appear first. Leave blank to sort by name.",
      validation: { isRequired: false },
    }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Config                                                                     */
/* -------------------------------------------------------------------------- */

export default config({
  storage: isDev
    ? { kind: "local" }
    : { kind: "github", repo: githubRepo },

  ui: {
    brand: { name: "APC Lagos" },
    navigation: {
      "Party leadership": ["leaders", "councilOfficials"],
      "Elected representatives": [
        "senators",
        "houseOfRepresentatives",
        "houseOfAssembly",
      ],
      Elections: ["candidates"],
    },
  },

  collections: {
    leaders: collection({
      label: "State leadership",
      path: "content/people/leaders/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "position"],
      schema: {
        ...personFields(),
        body: fields.select({
          label: "Leadership organ",
          options: labelOptions(leadershipBodyLabels),
          defaultValue: "state-executive",
        }),
        featured: fields.checkbox({
          label: "Feature on the homepage",
          defaultValue: false,
        }),
      },
    }),

    councilOfficials: collection({
      label: "Council chairmen & officials",
      path: "content/people/council-officials/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "position"],
      schema: {
        ...personFields(),
        councilSlug: fields.select({
          label: "Council",
          description: "The LGA or LCDA this official serves.",
          options: councilOptions,
          defaultValue: councilOptions[0].value,
        }),
        councilRole: fields.select({
          label: "Role",
          options: [
            { label: "Chairman", value: "Chairman" },
            { label: "Vice Chairman", value: "Vice Chairman" },
            {
              label: "Secretary to the Local Government",
              value: "Secretary to the Local Government",
            },
            { label: "Supervisor", value: "Supervisor" },
            { label: "Councillor", value: "Councillor" },
            { label: "Party Chairman", value: "Party Chairman" },
          ],
          defaultValue: "Chairman",
        }),
      },
    }),

    senators: collection({
      label: "Senators",
      path: "content/people/senators/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "position"],
      schema: {
        ...personFields(),
        senatorialDistrictSlug: fields.select({
          label: "Senatorial district",
          options: districtOptions,
          defaultValue: districtOptions[0].value,
        }),
      },
    }),

    houseOfRepresentatives: collection({
      label: "House of Representatives",
      path: "content/people/house-of-representatives/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "position"],
      schema: {
        ...personFields(),
        federalConstituencySlug: fields.select({
          label: "Federal constituency",
          options: federalOptions,
          defaultValue: federalOptions[0].value,
        }),
        senatorialDistrictSlug: fields.select({
          label: "Senatorial district",
          description: "Used by the district filter on the chamber page.",
          options: districtOptions,
          defaultValue: districtOptions[0].value,
        }),
      },
    }),

    houseOfAssembly: collection({
      label: "House of Assembly",
      path: "content/people/house-of-assembly/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "position"],
      schema: {
        ...personFields(),
        stateConstituencySlug: fields.select({
          label: "State constituency",
          options: stateOptions,
          defaultValue: stateOptions[0].value,
        }),
        lgaSlug: fields.select({
          label: "Local government",
          options: lgaOptions,
          defaultValue: lgaOptions[0].value,
        }),
      },
    }),

    candidates: collection({
      label: "Candidates",
      path: "content/people/candidates/*",
      format: { data: "json" },
      slugField: "name",
      columns: ["name", "position"],
      schema: {
        ...personFields(),
        electionSlug: fields.select({
          label: "Election",
          options: elections.map((e) => ({ label: e.name, value: e.slug })),
          defaultValue: elections[0]?.slug ?? "2027",
        }),
        office: fields.select({
          label: "Office contested",
          options: labelOptions(electionOfficeLabels),
          defaultValue: "house-of-assembly",
        }),
        contestedSeat: fields.text({
          label: "Seat",
          description: "e.g. “Lagos West Senatorial District”.",
          validation: { isRequired: false },
        }),
        featured: fields.checkbox({
          label: "Feature on the homepage",
          defaultValue: false,
        }),
      },
    }),
  },
});
