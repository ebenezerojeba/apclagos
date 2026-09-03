import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { AchievementBrowser } from "@/components/directories/AchievementBrowser";
import { AwaitingRecordsState } from "@/components/ui/states";
import { getAchievements } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { achievementCategoryLabels, optionsFrom } from "@/lib/labels";
import { unique } from "@/lib/utils";
import type { AchievementCategory } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Achievements and delivery record",
  description:
    "Projects, programmes and milestones recorded by APC Lagos, organised by sector, year and local government, with the source of each claim.",
  path: "/achievements",
  keywords: [
    "APC Lagos achievements",
    "Lagos State projects",
    "Lagos government delivery",
  ],
});

export default async function AchievementsPage() {
  const achievements = await getAchievements();
  const categories = achievements.map((a) => a.category) as AchievementCategory[];
  const years = unique(
    achievements
      .map((a) => a.year)
      .filter((year): year is number => typeof year === "number"),
  ).sort((a, b) => b - a);

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Achievements"
        description="Projects, programmes and milestones recorded across Lagos State. Every entry carries the ministry, agency or council that published it, so each claim stays attributable."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Achievements", href: "/achievements" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Published entries", value: achievements.length },
            { label: "Sectors", value: new Set(categories).size },
            { label: "Years covered", value: years.length },
            {
              label: "With a cited source",
              value: achievements.filter((a) => a.source).length,
            },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {achievements.length === 0 ? (
          <AwaitingRecordsState
            what="Achievements"
            dataFile="src/data/resources.ts"
          />
        ) : (
          <AchievementBrowser
            achievements={achievements}
            categories={optionsFrom(achievementCategoryLabels, categories)}
            years={years}
          />
        )}
      </Section>
    </>
  );
}
