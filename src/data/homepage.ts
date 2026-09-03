import type { ImageAsset } from "@/types/content";

/**
 * Homepage composition.
 *
 * Copy and imagery live here so the front page can be re-shaped without touching
 * a component. Nothing below asserts a political fact — the hero states what the
 * chapter is and what this platform does.
 */

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

export interface HeroSlide {
  id: string;
  image: ImageAsset;
  /** Short label shown on the slide indicator. Two words at most. */
  label: string;
  eyebrow: string;
  /** Rendered word by word. Keep it to one line on desktop. */
  headline: string;
  supporting: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /**
   * How hard to tint the photograph so white type stays legible. Set from the
   * image's own brightness: a bright, high-key frame needs more than a dusk one.
   */
  overlay: "light" | "medium" | "heavy";
  /**
   * `object-position` for the frame. Wide crops on desktop and tall crops on
   * mobile cut different parts away, so each is set separately — this is what
   * keeps faces and the skyline in shot rather than cropped off.
   */
  focus: string;
  focusMobile: string;
}

/**
 * The hero runs as a sequence, not a shuffle: Lagos and its people, then the
 * leadership, then the party at work. A first-time visitor should read it as
 * one continuous statement about the chapter.
 *
 * To add a slide, drop the photograph into `public/images/hero/` and add an
 * entry. Order here is the order on screen. Remove every entry and the hero
 * falls back to its generated backdrop — it never shows a broken image.
 *
 * NEEDS-VERIFICATION — the `alt` text below describes only what is visibly in
 * each photograph. Replace it with the actual occasion, and the names or offices
 * of the people shown, once those are confirmed; accurate alt text matters both
 * for screen-reader users and for the record.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: "lagos",
    label: "Lagos",
    image: {
      src: "/images/hero/hero-background.jpg",
      alt: "Residents and professionals on a waterfront terrace at sunset, overlooking the lagoon, a cable-stayed bridge and the Lagos skyline.",
      width: 1376,
      height: 768,
      role: "hero",
    },
    eyebrow: "All Progressives Congress · Lagos State",
    headline: "The party structure of Lagos, on the record.",
    supporting:
      "Every office, every council, every constituency. APC Lagos publishes its leadership, its 57 local councils, its representatives and its candidates in one place — kept current, and open to everyone.",
    primaryCta: { label: "Explore the structure", href: "/structure" },
    secondaryCta: { label: "Find your council", href: "/councils" },
    // Dusk frame, already dark through the left third where the type sits.
    overlay: "light",
    focus: "50% 50%",
    focusMobile: "38% 58%",
  },
  {
    id: "leadership",
    label: "Leadership",
    image: {
      src: "/images/hero/hero1.jpg",
      alt: "Party leaders and officials gathered for a group photograph in front of a Renewed Hope Agenda billboard at an APC building.",
      width: 1264,
      height: 841,
      role: "hero",
    },
    eyebrow: "Party leadership",
    headline: "The people who lead APC Lagos.",
    supporting:
      "State executives, council chairmen, senators, members of the House of Representatives and the State House of Assembly — each profile published as the party confirms it.",
    primaryCta: { label: "View leadership", href: "/leadership" },
    secondaryCta: { label: "All 57 councils", href: "/councils" },
    // High-key frame: pale sky and a lit billboard both need holding back.
    overlay: "heavy",
    focus: "50% 52%",
    focusMobile: "50% 64%",
  },
  {
    id: "party-at-work",
    label: "The party at work",
    image: {
      src: "/images/hero/hero2.jpg",
      alt: "Party officials in a working session around a boardroom table, with APC banners and party documents.",
      width: 1264,
      height: 843,
      role: "hero",
    },
    eyebrow: "The party at work",
    headline: "From the state executive to every ward.",
    supporting:
      "20 Local Government Areas, 37 LCDAs, 3 senatorial districts, 24 federal and 40 state constituencies. Walk the whole structure, tier by tier.",
    primaryCta: { label: "Open the structure explorer", href: "/structure" },
    secondaryCta: { label: "Election 2027", href: "/elections/2027" },
    // Busy interior, mid-key: needs a firm tint behind the type.
    overlay: "medium",
    focus: "50% 46%",
    focusMobile: "42% 46%",
  },
];

export const heroSettings = {
  /** How long each slide holds before advancing, in milliseconds. */
  intervalMs: 6500,
  /** Crossfade length. Long enough to read as a dissolve, not a cut. */
  transitionMs: 1400,
} as const;

/** Used when no slides are configured, so the hero always has copy to show. */
export const heroFallback = {
  eyebrow: "All Progressives Congress · Lagos State",
  headline: "The party structure of Lagos, on the record.",
  supporting:
    "Every office, every council, every constituency. APC Lagos publishes its leadership, its 57 local councils, its representatives and its candidates in one place — kept current, and open to everyone.",
  primaryCta: { label: "Explore the structure", href: "/structure" },
  secondaryCta: { label: "Find your council", href: "/councils" },
} as const;

/** Entry points shown directly beneath the hero. */
export const quickLinks: {
  title: string;
  description: string;
  href: string;
  cta: string;
}[] = [
  {
    title: "Leadership",
    description:
      "The state executive, the working committee and the party's leadership organs.",
    href: "/leadership",
    cta: "View leadership",
  },
  {
    title: "57 Local Councils",
    description:
      "Search all 20 LGAs and 37 LCDAs, with chairmen, wards and council information.",
    href: "/councils",
    cta: "Open the directory",
  },
  {
    title: "Your representatives",
    description:
      "Senators, members of the House of Representatives and the State House of Assembly.",
    href: "/representatives",
    cta: "Find a representative",
  },
  {
    title: "Election 2027",
    description:
      "Candidates by office and constituency, published as each nomination is confirmed.",
    href: "/elections/2027",
    cta: "Go to Election 2027",
  },
];

export const structurePromo = {
  eyebrow: "Political structure",
  title: "From the state executive down to every ward",
  description:
    "Lagos State is organised into 20 Local Government Areas and 37 Local Council Development Areas, grouped into 3 senatorial districts, 24 federal constituencies and 40 state constituencies. The explorer walks the whole hierarchy, tier by tier.",
  cta: { label: "Open the structure explorer", href: "/structure" },
};
