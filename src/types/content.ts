/**
 * Domain models for the APC Lagos platform.
 *
 * Every model is deliberately serialisable (no class instances, no Dates) so the
 * same shapes can travel from a local `src/data` file today and from a
 * Node/Express + database API tomorrow without touching a single component.
 *
 * Conventions
 *  - `slug` is the public URL segment and is treated as the stable primary key.
 *  - `status` gates visibility; only `"published"` records reach the public site.
 *  - Anything the party has not yet supplied is left `undefined` rather than
 *    filled with invented content. The UI renders an explicit pending state.
 */

export type Slug = string;

/** `YYYY-MM-DD` or a full ISO-8601 timestamp. */
export type ISODateString = string;

export type PublishStatus = "draft" | "published" | "archived";

/** Marks a record that ships with the repo purely to demonstrate layout. */
export interface SampleFlag {
  /** When true the UI renders a visible "Sample" badge. Never set on real data. */
  isSample?: boolean;
}

export interface BaseRecord extends SampleFlag {
  id: string;
  slug: Slug;
  status: PublishStatus;
  /** Manual sort weight - lower sorts first. Falls back to alphabetical. */
  order?: number;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

/* -------------------------------------------------------------------------- */
/*  Media                                                                      */
/* -------------------------------------------------------------------------- */

export type ImageRole =
  | "portrait"
  | "hero"
  | "news"
  | "event"
  | "gallery"
  | "document"
  | "logo"
  | "generic";

export interface ImageAsset {
  /** Path under /public (e.g. `/images/people/ade-adeyemi.jpg`) or an absolute URL. */
  src: string;
  /** Required: describes the image for screen readers and when loading fails. */
  alt: string;
  width?: number;
  height?: number;
  /** Which part of the frame must never be cropped away. Drives `object-position`. */
  focal?: "top" | "center" | "bottom" | "left" | "right";
  credit?: string;
  caption?: string;
  role?: ImageRole;
  /** Tiny base64 LQIP. Optional - omit and the component falls back to a tint. */
  blurDataURL?: string;
}

export interface VideoEmbed {
  provider: "youtube" | "vimeo" | "file";
  /** YouTube/Vimeo id, or an absolute URL for `provider: "file"`. */
  ref: string;
  /** Optional custom poster. YouTube posters are derived automatically. */
  poster?: ImageAsset;
  /** Human readable, e.g. "12:04". */
  duration?: string;
}

/* -------------------------------------------------------------------------- */
/*  Shared value objects                                                       */
/* -------------------------------------------------------------------------- */

export interface SocialLinks {
  facebook?: string;
  x?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface ContactInfo {
  addressLines?: string[];
  city?: string;
  state?: string;
  postcode?: string;
  phones?: string[];
  emails?: string[];
  openingHours?: string;
  mapQuery?: string;
}

/* -------------------------------------------------------------------------- */
/*  People                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Discriminator for the person sub-types. Used by global search, by the
 * `PersonCard` variant picker, and by the admin CMS to route edit screens.
 */
export type PersonKind =
  | "leader"
  | "chairman"
  | "senator"
  | "house-of-representatives"
  | "house-of-assembly"
  | "candidate"
  | "official";

export interface Person extends BaseRecord {
  kind: PersonKind;
  /** Given + family name only. Titles live in `honorific`. */
  name: string;
  /** e.g. "His Excellency", "Rt. Hon.", "Hon.", "Chief", "Dr." */
  honorific?: string;
  /** Post-nominals, e.g. "SAN", "OFR". */
  postNominals?: string;
  /** The office held or sought, e.g. "State Chairman". */
  position: string;
  /** Compact label used on dense cards when `position` is long. */
  shortPosition?: string;
  /** One or two sentences. Rendered on cards. */
  summary?: string;
  /** Full biography, one paragraph per array entry. */
  biography?: string[];
  portrait?: ImageAsset;
  /** LGA, LCDA, district or constituency the person serves. Free text label. */
  jurisdiction?: string;
  /** Machine-readable links back into the political structure. */
  lgaSlug?: Slug;
  lcdaSlug?: Slug;
  wardSlug?: Slug;
  senatorialDistrictSlug?: Slug;
  federalConstituencySlug?: Slug;
  stateConstituencySlug?: Slug;
  tenureStart?: ISODateString;
  tenureEnd?: ISODateString;
  education?: string[];
  careerHighlights?: string[];
  previousPositions?: string[];
  committees?: string[];
  social?: SocialLinks;
  contact?: ContactInfo;
  galleryAlbumSlugs?: Slug[];
  relatedNewsSlugs?: Slug[];
  tags?: string[];
}

/** Which organ of the party or government a leader belongs to. */
export type LeadershipBody =
  | "state-executive"
  | "state-working-committee"
  | "elders-council"
  | "government"
  | "national-representation"
  | "party-organ";

export interface Leader extends Person {
  kind: "leader";
  body: LeadershipBody;
  /** Marks the small set of profiles surfaced on the homepage. */
  featured?: boolean;
}

export type CouncilType = "LGA" | "LCDA";

export type CouncilRole =
  | "Chairman"
  | "Vice Chairman"
  | "Secretary to the Local Government"
  | "Supervisor"
  | "Councillor"
  | "Party Chairman";

export interface CouncilOfficial extends Person {
  kind: "chairman" | "official";
  councilSlug: Slug;
  councilType: CouncilType;
  councilRole: CouncilRole;
}

export interface Senator extends Person {
  kind: "senator";
  senatorialDistrictSlug: Slug;
}

export interface HouseOfRepresentativesMember extends Person {
  kind: "house-of-representatives";
  federalConstituencySlug: Slug;
}

export interface HouseOfAssemblyMember extends Person {
  kind: "house-of-assembly";
  stateConstituencySlug: Slug;
}

export type Representative =
  | Senator
  | HouseOfRepresentativesMember
  | HouseOfAssemblyMember;

/** The chamber a representative sits in. Drives tabs and filters. */
export type Chamber = "senate" | "house-of-representatives" | "house-of-assembly";

/* -------------------------------------------------------------------------- */
/*  Elections & candidates                                                     */
/* -------------------------------------------------------------------------- */

export type ElectionOffice =
  | "governor"
  | "deputy-governor"
  | "senate"
  | "house-of-representatives"
  | "house-of-assembly"
  | "local-government-chairman"
  | "councillor"
  | "other";

export interface Election extends BaseRecord {
  name: string;
  /** Calendar year, e.g. 2027. */
  year: number;
  /** Polling date once published by INEC. Left undefined until confirmed. */
  date?: ISODateString;
  summary?: string;
  description?: string[];
  offices: ElectionOffice[];
  /** "upcoming" powers the Election 2027 hub; "past" powers the archive. */
  phase: "upcoming" | "ongoing" | "past";
  hero?: ImageAsset;
}

export interface CandidatePriority {
  title: string;
  description: string;
}

export interface Candidate extends Person {
  kind: "candidate";
  electionSlug: Slug;
  office: ElectionOffice;
  /** Human-readable seat, e.g. "Lagos West Senatorial District". */
  contestedSeat?: string;
  runningMateSlug?: Slug;
  manifesto?: string[];
  keyPriorities?: CandidatePriority[];
  /** Populated only for concluded elections. Never inferred. */
  result?: {
    outcome: "won" | "lost" | "withdrew" | "pending";
    votes?: number;
    notes?: string;
  };
  featured?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Political geography                                                        */
/* -------------------------------------------------------------------------- */

export interface SenatorialDistrict extends BaseRecord {
  name: string;
  /** LGA slugs that make up the district. */
  lgaSlugs: Slug[];
  description?: string;
}

export interface FederalConstituency extends BaseRecord {
  name: string;
  senatorialDistrictSlug: Slug;
  lgaSlugs: Slug[];
}

export interface StateConstituency extends BaseRecord {
  name: string;
  federalConstituencySlug: Slug;
  lgaSlug: Slug;
}

export interface Ward extends BaseRecord {
  name: string;
  /** Ward code where the party or INEC publishes one, e.g. "01". */
  code?: string;
  lgaSlug: Slug;
  lcdaSlug?: Slug;
}

export interface LocalGovernmentArea extends BaseRecord {
  name: string;
  councilType: "LGA";
  headquarters?: string;
  /** Number of INEC wards. Kept as data so it can be corrected centrally. */
  wardCount?: number;
  /** LCDAs carved out of this LGA. */
  lcdaSlugs: Slug[];
  senatorialDistrictSlug: Slug;
  federalConstituencySlugs: Slug[];
  stateConstituencySlugs: Slug[];
  chairmanSlug?: Slug;
  partyChairmanSlug?: Slug;
  description?: string[];
  contact?: ContactInfo;
  cover?: ImageAsset;
  achievementSlugs?: Slug[];
  galleryAlbumSlugs?: Slug[];
}

export interface LocalCouncilDevelopmentArea extends BaseRecord {
  name: string;
  councilType: "LCDA";
  parentLgaSlug: Slug;
  headquarters?: string;
  wardCount?: number;
  chairmanSlug?: Slug;
  viceChairmanSlug?: Slug;
  secretarySlug?: Slug;
  partyChairmanSlug?: Slug;
  description?: string[];
  contact?: ContactInfo;
  cover?: ImageAsset;
  achievementSlugs?: Slug[];
  galleryAlbumSlugs?: Slug[];
}

/** Either tier of local council - the directory renders both through one card. */
export type Council = LocalGovernmentArea | LocalCouncilDevelopmentArea;

/* -------------------------------------------------------------------------- */
/*  Editorial                                                                  */
/* -------------------------------------------------------------------------- */

export type NewsCategorySlug =
  | "apc-lagos"
  | "leadership"
  | "elections"
  | "government"
  | "lcdas"
  | "lgas"
  | "house-of-assembly"
  | "house-of-representatives"
  | "senate"
  | "events"
  | "press-releases";

export interface NewsCategory {
  slug: NewsCategorySlug;
  name: string;
  description: string;
}

export interface Author {
  name: string;
  role?: string;
  avatar?: ImageAsset;
}

/** A minimal block model - richer than a string, simpler than a full CMS AST. */
export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "image"; image: ImageAsset }
  | { type: "video"; video: VideoEmbed; title?: string };

export interface NewsArticle extends BaseRecord {
  title: string;
  /** Optional short deck shown above the headline. */
  kicker?: string;
  excerpt: string;
  category: NewsCategorySlug;
  tags?: string[];
  author?: Author;
  publishedAt: ISODateString;
  cover?: ImageAsset;
  body: ArticleBlock[];
  featured?: boolean;
  /** Editorial pin for the "Most read" rail. Higher sorts first. */
  popularity?: number;
  relatedPersonSlugs?: Slug[];
  relatedCouncilSlugs?: Slug[];
  relatedArticleSlugs?: Slug[];
}

export type EventCategory =
  | "congress"
  | "rally"
  | "meeting"
  | "town-hall"
  | "commissioning"
  | "training"
  | "community"
  | "other";

export interface PartyEvent extends BaseRecord {
  title: string;
  summary: string;
  description?: ArticleBlock[];
  category: EventCategory;
  /** ISO timestamp including offset, e.g. 2027-01-14T10:00:00+01:00 */
  startsAt: ISODateString;
  endsAt?: ISODateString;
  venueName?: string;
  venueAddress?: string;
  lgaSlug?: Slug;
  cover?: ImageAsset;
  registrationUrl?: string;
  /** Set when the event is cancelled or postponed so the UI can say so. */
  notice?: string;
  galleryAlbumSlug?: Slug;
}

/* -------------------------------------------------------------------------- */
/*  Media library                                                              */
/* -------------------------------------------------------------------------- */

export type GalleryCategory =
  | "leadership"
  | "campaign"
  | "events"
  | "community"
  | "government"
  | "congress"
  | "other";

export interface GalleryAlbum extends BaseRecord {
  title: string;
  description?: string;
  category: GalleryCategory;
  date?: ISODateString;
  location?: string;
  cover?: ImageAsset;
  images: ImageAsset[];
  relatedEventSlug?: Slug;
}

export type VideoCategory =
  | "campaign"
  | "interviews"
  | "events"
  | "speeches"
  | "documentary"
  | "activities";

export interface Video extends BaseRecord {
  title: string;
  description?: string;
  category: VideoCategory;
  embed: VideoEmbed;
  publishedAt?: ISODateString;
  featured?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Achievements & documents                                                   */
/* -------------------------------------------------------------------------- */

export type AchievementCategory =
  | "infrastructure"
  | "education"
  | "health"
  | "security"
  | "economy"
  | "transport"
  | "environment"
  | "social"
  | "party-organisation";

export interface AchievementMetric {
  label: string;
  value: string;
}

export interface Achievement extends BaseRecord {
  title: string;
  summary: string;
  description?: string[];
  category: AchievementCategory;
  /** Calendar year the milestone is attributed to. */
  year?: number;
  location?: string;
  lgaSlug?: Slug;
  metrics?: AchievementMetric[];
  cover?: ImageAsset;
  video?: VideoEmbed;
  /** Source or approving authority, so every claim stays attributable. */
  source?: string;
}

export type DocumentCategory =
  | "constitution"
  | "policy"
  | "guidelines"
  | "forms"
  | "reports"
  | "press"
  | "manifesto";

export interface PartyDocument extends BaseRecord {
  title: string;
  description?: string;
  category: DocumentCategory;
  /** Path under /public or an absolute URL. */
  fileUrl: string;
  fileType: "pdf" | "doc" | "docx" | "xls" | "xlsx" | "zip" | "other";
  fileSizeLabel?: string;
  publishedAt?: ISODateString;
}

/* -------------------------------------------------------------------------- */
/*  Milestones (About / timeline)                                              */
/* -------------------------------------------------------------------------- */

export interface Milestone {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: ImageAsset;
}

/* -------------------------------------------------------------------------- */
/*  Statistics                                                                 */
/* -------------------------------------------------------------------------- */

export interface StatItem {
  id: string;
  label: string;
  value: number;
  /** Rendered after the counter, e.g. "+" or "%". */
  suffix?: string;
  prefix?: string;
  description?: string;
  href?: string;
  /** Shown as a footnote so every figure stays attributable. */
  note?: string;
}

/* -------------------------------------------------------------------------- */
/*  Global search                                                              */
/* -------------------------------------------------------------------------- */

export type SearchEntityType =
  | "person"
  | "candidate"
  | "lga"
  | "lcda"
  | "ward"
  | "constituency"
  | "news"
  | "event"
  | "gallery"
  | "video"
  | "document"
  | "page";

export interface SearchDocument {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  image?: ImageAsset;
  /** Lowercased haystack assembled at build time. */
  keywords: string;
  /** Higher wins ties. Pages and leadership rank above deep records. */
  weight: number;
}
