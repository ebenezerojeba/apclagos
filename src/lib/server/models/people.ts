/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { Schema, type Types } from "mongoose";
import {
  addPreHook,
  attachPublishHook,
  defineModel,
  imageSchema,
  publishableFields,
  type CloudinaryImage,
  type PublishStatus,
} from "./shared";

/**
 * Everyone the party publishes: state leadership, council chairmen, senators,
 * members of both federal chambers, members of the State House of Assembly and
 * election candidates.
 *
 * One model, discriminated by `kind` — matching `PersonKind` in
 * `src/types/content.ts`. Six collections would duplicate the same twenty
 * fields six times and force six admin screens; the differences between a
 * senator and a candidate amount to which constituency reference is set and
 * whether an election is attached.
 *
 * The constituency slugs reference `src/data/geography.ts`, which stays in the
 * repository on purpose: the 20 LGAs, 37 LCDAs and 67 constituencies of Lagos
 * are structural facts that change through legislation, not through the CMS.
 * Putting them in MongoDB would invite an editor to mistype one and silently
 * detach every officeholder attached to it.
 */

export const PERSON_KINDS = [
  "leader",
  "chairman",
  "official",
  "senator",
  "house-of-representatives",
  "house-of-assembly",
  "candidate",
] as const;
export type PersonKind = (typeof PERSON_KINDS)[number];

export const LEADERSHIP_BODIES = [
  "state-executive",
  "state-working-committee",
  "elders-council",
  "government",
  "national-representation",
  "party-organ",
] as const;

export const COUNCIL_ROLES = [
  "Chairman",
  "Vice Chairman",
  "Secretary to the Local Government",
  "Supervisor",
  "Councillor",
  "Party Chairman",
] as const;

export const ELECTION_OFFICES = [
  "governor",
  "deputy-governor",
  "senate",
  "house-of-representatives",
  "house-of-assembly",
  "local-government-chairman",
  "councillor",
  "other",
] as const;

export interface PersonDoc {
  _id: Types.ObjectId;
  slug: string;
  status: PublishStatus;
  publishedAt?: Date;
  order?: number;

  kind: PersonKind;
  name: string;
  honorific?: string;
  postNominals?: string;
  position: string;
  shortPosition?: string;
  summary?: string;
  biography: string[];
  portrait?: CloudinaryImage;
  jurisdiction?: string;

  // Structural references into src/data/geography.ts.
  senatorialDistrictSlug?: string;
  federalConstituencySlug?: string;
  stateConstituencySlug?: string;
  lgaSlug?: string;
  lcdaSlug?: string;

  // Leadership only.
  body?: (typeof LEADERSHIP_BODIES)[number];
  featured: boolean;

  // Council officials only.
  councilSlug?: string;
  councilType?: "LGA" | "LCDA";
  councilRole?: (typeof COUNCIL_ROLES)[number];

  // Candidates only.
  electionSlug?: string;
  office?: (typeof ELECTION_OFFICES)[number];
  contestedSeat?: string;
  runningMateSlug?: string;
  manifesto: string[];
  keyPriorities: { title: string; description: string }[];

  tenureStart?: Date;
  tenureEnd?: Date;
  education: string[];
  careerHighlights: string[];
  previousPositions: string[];
  committees: string[];
  tags: string[];

  social: {
    facebook?: string;
    x?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
  email?: string;
  phone?: string;

  createdAt: Date;
  updatedAt: Date;
}

const prioritySchema = new Schema<any>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 600 },
  },
  { _id: false },
);

const personSchema = new Schema<any>(
  {
    ...publishableFields,

    kind: { type: String, enum: [...PERSON_KINDS], required: true, index: true },
    name: { type: String, required: [true, "A full name is required."], trim: true, maxlength: 160 },
    honorific: { type: String, trim: true, maxlength: 40 },
    postNominals: { type: String, trim: true, maxlength: 40 },
    position: { type: String, required: [true, "An office or position is required."], trim: true, maxlength: 200 },
    shortPosition: { type: String, trim: true, maxlength: 80 },
    summary: { type: String, trim: true, maxlength: 400 },
    biography: [{ type: String, trim: true }],
    portrait: { type: imageSchema },
    jurisdiction: { type: String, trim: true, maxlength: 160 },

    senatorialDistrictSlug: { type: String, trim: true, lowercase: true, index: true },
    federalConstituencySlug: { type: String, trim: true, lowercase: true, index: true },
    stateConstituencySlug: { type: String, trim: true, lowercase: true, index: true },
    lgaSlug: { type: String, trim: true, lowercase: true, index: true },
    lcdaSlug: { type: String, trim: true, lowercase: true },

    body: { type: String, enum: [...LEADERSHIP_BODIES] },
    featured: { type: Boolean, default: false },

    councilSlug: { type: String, trim: true, lowercase: true, index: true },
    councilType: { type: String, enum: ["LGA", "LCDA"] },
    councilRole: { type: String, enum: [...COUNCIL_ROLES] },

    electionSlug: { type: String, trim: true, lowercase: true, index: true },
    office: { type: String, enum: [...ELECTION_OFFICES] },
    contestedSeat: { type: String, trim: true, maxlength: 200 },
    runningMateSlug: { type: String, trim: true, lowercase: true },
    manifesto: [{ type: String, trim: true }],
    keyPriorities: { type: [prioritySchema], default: [] },

    tenureStart: { type: Date },
    tenureEnd: { type: Date },
    education: [{ type: String, trim: true, maxlength: 300 }],
    careerHighlights: [{ type: String, trim: true, maxlength: 300 }],
    previousPositions: [{ type: String, trim: true, maxlength: 300 }],
    committees: [{ type: String, trim: true, maxlength: 200 }],
    tags: [{ type: String, trim: true, maxlength: 40 }],

    social: {
      facebook: { type: String, trim: true },
      x: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 },
  },
  { timestamps: true },
);

// A slug is unique per kind, so a chairman and a candidate may share a name
// without one silently overwriting the other.
personSchema.index({ kind: 1, slug: 1 }, { unique: true });
personSchema.index({ kind: 1, status: 1, order: 1, name: 1 });
personSchema.index({ name: "text", position: "text", jurisdiction: "text" });
attachPublishHook(personSchema);

/**
 * Each kind carries the reference that makes it findable. Without this a
 * senator could be saved with no district and then never appear on the page
 * that lists senators by district — a silent disappearance, which is the worst
 * failure mode for a directory of officeholders.
 */
addPreHook(personSchema, "validate", function (next) {
  const doc = this as PersonDoc & {
    invalidate: (path: string, message: string) => void;
  };
  const required: Partial<Record<PersonKind, [keyof PersonDoc, string]>> = {
    senator: ["senatorialDistrictSlug", "a senatorial district"],
    "house-of-representatives": ["federalConstituencySlug", "a federal constituency"],
    "house-of-assembly": ["stateConstituencySlug", "a state constituency"],
    chairman: ["councilSlug", "a council"],
    candidate: ["electionSlug", "an election"],
  };

  const rule = required[doc.kind];
  if (rule && !doc[rule[0]]) {
    doc.invalidate(rule[0] as string, `Select ${rule[1]} for this record.`);
  }
  if (doc.kind === "leader" && !doc.body) {
    doc.invalidate("body", "Select which leadership organ this person belongs to.");
  }
  next();
});

export const Person = defineModel<PersonDoc>("Person", personSchema);
