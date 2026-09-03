import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { QuickLinks, StatsBand, StructurePromo } from "@/components/sections/HomeIntro";
import {
  CouncilsPreview,
  ElectionPreview,
  LeadershipPreview,
  RepresentativesPreview,
} from "@/components/sections/HomePeople";
import {
  ContactCta,
  EventsPreview,
  MediaPreview,
  NewsPreview,
} from "@/components/sections/HomeEditorial";
import { getHeadlineStats, getHeroStats } from "@/data/stats";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — ${siteConfig.legalName}`,
  description: siteConfig.description,
  path: "/",
  keywords: [
    "APC Lagos",
    "All Progressives Congress Lagos State",
    "Lagos LCDAs",
    "Lagos local government",
    "Lagos State House of Assembly",
    "Lagos senatorial districts",
    "Election 2027 Lagos",
  ],
});

export default function HomePage() {
  return (
    <>
      <Hero stats={getHeroStats()} />
      <QuickLinks />
      <StatsBand stats={getHeadlineStats()} />
      <LeadershipPreview />
      <CouncilsPreview />
      <StructurePromo />
      <RepresentativesPreview />
      <ElectionPreview />
      <NewsPreview />
      <EventsPreview />
      <MediaPreview />
      <ContactCta />
    </>
  );
}
