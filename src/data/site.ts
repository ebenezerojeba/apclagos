import type { ContactInfo, SocialLinks } from "@/types/content";

/**
 * Single source of truth for organisation-level facts, navigation and contact
 * details. Everything an administrator is likely to change without a developer
 * lives here rather than inside a component.
 *
 * Fields marked NEEDS-VERIFICATION are structural placeholders: replace them
 * with the party's authoritative details before launch.
 */

export const siteConfig = {
  name: "APC Lagos",
  legalName: "All Progressives Congress, Lagos State Chapter",
  shortName: "APC Lagos State",
  tagline: "Progress. Service. Lagos.",
  description:
    "The official digital information platform of the All Progressives Congress, Lagos State Chapter - party leadership, local councils, elected representatives, candidates, news and events.",
  /** Set NEXT_PUBLIC_SITE_URL in the environment; this is the fallback. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://apclagos.vercel.app",
  locale: "en_NG",
  language: "en-NG",
  /** Used for date formatting across the site. */
  timeZone: "Africa/Lagos",
  founded: "2013",
  /** Generated social card. Replace with a static asset path if artwork is supplied. */
  ogImage: "/api/og",
} as const;

/**
 * The party's official logo.
 *
 * Save the artwork to the path below and it is used in the header, the mobile
 * drawer and the footer at once. Until the file is present the lockup falls
 * back to the SVG emblem in `src/components/layout/Brand.tsx` — the fallback is
 * also used if the image ever fails to load, so the header can never show a
 * broken image.
 *
 * The official APC mark is a landscape lockup (the green/white/blue field with
 * the broom, over the red "APC" band). Keep `width`/`height` in step with the
 * file's real aspect ratio: the lockup sizes by height and lets the width
 * follow, so a wrong ratio is the one thing that will distort it.
 *
 * Recommended: PNG with a transparent or white background, 640px wide or more,
 * trimmed to the artwork's own edges.
 */
export const brandLogo: { src: string; alt: string; width: number; height: number } = {
  src: "/images/logos/apc-logo.png",
  alt: "All Progressives Congress logo",
  width: 640,
  height: 504,
};

/** NEEDS-VERIFICATION: replace with the secretariat's published details. */
export const siteContact: ContactInfo = {
  addressLines: ["APC Lagos State Secretariat", "Address line to be supplied"],
  city: "Lagos",
  state: "Lagos State",
  phones: ["+234 000 000 0000"],
  emails: ["info@apclagos.org"],
  openingHours: "Monday to Friday, 9:00am - 5:00pm (WAT)",
  mapQuery: "Lagos State Secretariat, Alausa, Ikeja, Lagos",
};

/** NEEDS-VERIFICATION: replace with the party's official handles. */
export const siteSocial: SocialLinks = {
  facebook: "",
  x: "",
  instagram: "",
  youtube: "",
  linkedin: "",
};

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  /** Optional landing page for the whole group. */
  href?: string;
  /** Rendered as a mega-menu when present. */
  columns?: { title: string; links: NavLink[] }[];
  /** Short promo panel shown at the end of a mega menu. */
  feature?: {
    title: string;
    description: string;
    href: string;
    cta: string;
  };
}

/**
 * The primary navigation.
 *
 * Six top-level entries, not eleven. Measured at 1280px — the most common
 * laptop width — a bar carrying every destination needs 1448px and wraps, so
 * the two genuinely redundant entries are carried elsewhere (the logo is the
 * home link; Contact sits in the utility strip directly above, in the footer
 * and in the drawer), and the editorial routes are grouped under one Newsroom
 * mega menu. Every destination stays one click away, and the bar fits on a
 * single line from 1280px up.
 */
export const primaryNav: NavGroup[] = [
  {
    label: "About",
    href: "/about",
    columns: [
      {
        title: "The Party",
        links: [
          {
            label: "About APC Lagos",
            href: "/about",
            description: "History, mission and vision",
          },
          {
            label: "Party History",
            href: "/about#history",
            description: "Milestones since 2013",
          },
          {
            label: "Documents",
            href: "/documents",
            description: "Constitution, policies and forms",
          },
        ],
      },
      {
        title: "Organisation",
        links: [
          {
            label: "Political Structure",
            href: "/structure",
            description: "State to ward hierarchy",
          },
          {
            label: "Achievements",
            href: "/achievements",
            description: "Delivery record by sector",
          },
          {
            label: "Contact",
            href: "/contact",
            description: "Secretariat and enquiries",
          },
        ],
      },
    ],
    feature: {
      title: "Explore the structure",
      description:
        "Move from the state executive down through 20 LGAs, 37 LCDAs and every ward.",
      href: "/structure",
      cta: "Open the explorer",
    },
  },
  {
    label: "Leadership",
    href: "/leadership",
    columns: [
      {
        title: "Party Leadership",
        links: [
          {
            label: "State Executive",
            href: "/leadership?body=state-executive",
            description: "Officers of the state chapter",
          },
          {
            label: "Working Committee",
            href: "/leadership?body=state-working-committee",
            description: "Statutory committee members",
          },
          {
            label: "Elders Council",
            href: "/leadership?body=elders-council",
            description: "Advisory leadership",
          },
        ],
      },
      {
        title: "In Government",
        links: [
          {
            label: "Government Leadership",
            href: "/leadership?body=government",
            description: "Executive office holders",
          },
          {
            label: "National Representation",
            href: "/leadership?body=national-representation",
            description: "Lagos at the national level",
          },
        ],
      },
    ],
  },
  {
    label: "LGAs & LCDAs",
    href: "/councils",
    columns: [
      {
        title: "Local Councils",
        links: [
          {
            label: "All 57 Councils",
            href: "/councils",
            description: "Searchable directory",
          },
          {
            label: "20 Local Government Areas",
            href: "/lgas",
            description: "Constitutionally recognised LGAs",
          },
          {
            label: "37 LCDAs",
            href: "/lcdas",
            description: "Local Council Development Areas",
          },
        ],
      },
      {
        title: "Constituencies",
        links: [
          {
            label: "Wards",
            href: "/wards",
            description: "Ward-level delimitation",
          },
          {
            label: "Constituencies",
            href: "/constituencies",
            description: "Senatorial, federal and state seats",
          },
        ],
      },
    ],
    feature: {
      title: "Find your council",
      description:
        "Search all 57 local councils, view the chairman and jump to ward information.",
      href: "/councils",
      cta: "Open the directory",
    },
  },
  {
    label: "Representatives",
    href: "/representatives",
    columns: [
      {
        title: "Legislature",
        links: [
          {
            label: "Senate",
            href: "/representatives/senate",
            description: "3 senatorial districts",
          },
          {
            label: "House of Representatives",
            href: "/representatives/house-of-representatives",
            description: "24 federal constituencies",
          },
          {
            label: "House of Assembly",
            href: "/representatives/house-of-assembly",
            description: "40 state constituencies",
          },
        ],
      },
    ],
  },
  {
    label: "Candidates",
    href: "/candidates",
    columns: [
      {
        title: "Elections",
        links: [
          {
            label: "Election 2027",
            href: "/elections/2027",
            description: "The road to the next general election",
          },
          {
            label: "Candidate Directory",
            href: "/candidates",
            description: "Filter by office and constituency",
          },
          {
            label: "Past Elections",
            href: "/elections",
            description: "Archive and previous candidates",
          },
        ],
      },
    ],
  },
  {
    label: "Newsroom",
    href: "/news",
    columns: [
      {
        title: "Latest",
        links: [
          {
            label: "News",
            href: "/news",
            description: "Announcements and coverage",
          },
          {
            label: "Press Releases",
            href: "/news?category=press-releases",
            description: "Official statements",
          },
          {
            label: "Events",
            href: "/events",
            description: "Congresses, rallies and town halls",
          },
        ],
      },
      {
        title: "Media Library",
        links: [
          {
            label: "Photo Gallery",
            href: "/gallery",
            description: "Albums by event and campaign",
          },
          {
            label: "Videos",
            href: "/media",
            description: "Speeches, interviews and activities",
          },
          {
            label: "Achievements",
            href: "/achievements",
            description: "Delivery record by sector",
          },
        ],
      },
    ],
  },
];

/** The single most important action, shown in the header and mobile drawer. */
export const primaryCta = {
  label: "Election 2027",
  href: "/elections/2027",
} as const;

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "The Party",
    links: [
      { label: "About APC Lagos", href: "/about" },
      { label: "Leadership", href: "/leadership" },
      { label: "Political Structure", href: "/structure" },
      { label: "Achievements", href: "/achievements" },
      { label: "Documents", href: "/documents" },
    ],
  },
  {
    title: "Structure",
    links: [
      { label: "All Councils", href: "/councils" },
      { label: "Local Government Areas", href: "/lgas" },
      { label: "LCDAs", href: "/lcdas" },
      { label: "Wards", href: "/wards" },
      { label: "Constituencies", href: "/constituencies" },
    ],
  },
  {
    title: "Representation",
    links: [
      { label: "Senate", href: "/representatives/senate" },
      {
        label: "House of Representatives",
        href: "/representatives/house-of-representatives",
      },
      {
        label: "House of Assembly",
        href: "/representatives/house-of-assembly",
      },
      { label: "Candidates", href: "/candidates" },
      { label: "Election 2027", href: "/elections/2027" },
    ],
  },
  {
    title: "Newsroom",
    links: [
      { label: "Latest News", href: "/news" },
      { label: "Press Releases", href: "/news?category=press-releases" },
      { label: "Events", href: "/events" },
      { label: "Photo Gallery", href: "/gallery" },
      { label: "Videos", href: "/media" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Contact", href: "/contact" },
  { label: "Search", href: "/search" },
  { label: "Sitemap", href: "/sitemap.xml" },
];
