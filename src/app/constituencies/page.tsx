import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card, Badge } from "@/components/ui/primitives";
import {
  getFederalConstituencies,
  getHouseOfAssemblyMembers,
  getHouseOfRepresentativesMembers,
  getLgas,
  getSenators,
  getSenatorialDistricts,
  getStateConstituencies,
} from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { titleFromSlug } from "@/lib/format";

export const metadata: Metadata = buildMetadata({
  title: "Constituencies of Lagos State",
  description:
    "The 3 senatorial districts, 24 federal constituencies and 40 state constituencies of Lagos State, and the local governments each covers.",
  path: "/constituencies",
  keywords: [
    "Lagos senatorial districts",
    "Lagos federal constituencies",
    "Lagos state constituencies",
  ],
});

export default async function ConstituenciesPage() {
  const [districts, federal, state, lgas, senators, reps, assembly] =
    await Promise.all([
      getSenatorialDistricts(),
      getFederalConstituencies(),
      getStateConstituencies(),
      getLgas(),
      getSenators(),
      getHouseOfRepresentativesMembers(),
      getHouseOfAssemblyMembers(),
    ]);

  const lgaName = (slug: string) =>
    lgas.find((lga) => lga.slug === slug)?.name ?? titleFromSlug(slug);

  return (
    <>
      <PageHeader
        eyebrow="Political structure"
        title="Constituencies"
        description="Lagos State elects representatives from three tiers of constituency: 3 senatorial districts to the Senate, 24 federal constituencies to the House of Representatives, and 40 state constituencies to the Lagos State House of Assembly."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
          { name: "Constituencies", href: "/constituencies" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Senatorial districts", value: districts.length },
            { label: "Federal constituencies", value: federal.length },
            { label: "State constituencies", value: state.length },
            { label: "Local Government Areas", value: lgas.length },
          ]}
        />
      </PageHeader>

      {/* Senatorial districts */}
      <Section tone="canvas" ariaLabelledBy="districts-heading">
        <SectionHeader
          as="h2"
          eyebrow="Upper chamber"
          title={<span id="districts-heading">Senatorial districts</span>}
          description="Each district returns one senator to the National Assembly."
        />
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {districts.map((district) => {
            const senator = senators.find(
              (s) => s.senatorialDistrictSlug === district.slug,
            );
            return (
              <li key={district.slug} id={district.slug}>
                <Card className="h-full p-6 lg:p-7">
                  <Badge tone="ink">Senate</Badge>
                  <h3 className="mt-3 font-display text-xl text-fg">
                    {district.name}
                  </h3>
                  {district.description ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                      {district.description}
                    </p>
                  ) : null}
                  <p className="mt-4 text-[0.8125rem] text-fg-subtle">
                    {senator ? (
                      <>
                        Senator:{" "}
                        <Link
                          href={`/representatives/senate/${senator.slug}`}
                          className="font-medium text-ink-800 hover:underline"
                        >
                          {[senator.honorific, senator.name].filter(Boolean).join(" ")}
                        </Link>
                      </>
                    ) : (
                      "Senator profile pending"
                    )}
                  </p>
                  <div className="mt-5 border-t border-border-subtle pt-4">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                      Local governments ({district.lgaSlugs.length})
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {district.lgaSlugs.map((slug) => (
                        <li key={slug}>
                          <Link
                            href={`/lgas/${slug}`}
                            className="inline-block rounded-full border border-border bg-paper-100 px-2.5 py-1 text-[0.75rem] text-fg-muted transition-colors hover:border-ink-400 hover:text-ink-900"
                          >
                            {lgaName(slug)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Federal constituencies */}
      <Section tone="surface" ariaLabelledBy="federal-heading">
        <SectionHeader
          as="h2"
          eyebrow="House of Representatives"
          title={<span id="federal-heading">Federal constituencies</span>}
          description="Lagos State returns 24 members to the House of Representatives."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {federal.map((constituency) => {
            const member = reps.find(
              (r) => r.federalConstituencySlug === constituency.slug,
            );
            return (
              <li
                key={constituency.slug}
                id={constituency.slug}
                className="rounded-xl border border-border-subtle bg-canvas p-4"
              >
                <h3 className="font-display text-base text-fg">
                  {constituency.name.replace(" Federal Constituency", "")}
                </h3>
                <p className="mt-1 text-[0.8125rem] text-fg-subtle">
                  {member ? (
                    <Link
                      href={`/representatives/house-of-representatives/${member.slug}`}
                      className="font-medium text-ink-800 hover:underline"
                    >
                      {[member.honorific, member.name].filter(Boolean).join(" ")}
                    </Link>
                  ) : (
                    "Member profile pending"
                  )}
                </p>
                <p className="mt-2 text-[0.75rem] text-fg-subtle">
                  {constituency.lgaSlugs.map(lgaName).join(", ")}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* State constituencies */}
      <Section tone="canvas" ariaLabelledBy="state-heading">
        <SectionHeader
          as="h2"
          eyebrow="Lagos State House of Assembly"
          title={<span id="state-heading">State constituencies</span>}
          description="Two constituencies for each of the 20 Local Government Areas, returning 40 members in total."
        />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {state.map((constituency) => {
            const member = assembly.find(
              (a) => a.stateConstituencySlug === constituency.slug,
            );
            return (
              <li
                key={constituency.slug}
                id={constituency.slug}
                className="rounded-xl border border-border-subtle bg-surface p-4"
              >
                <h3 className="font-display text-base text-fg">
                  {constituency.name}
                </h3>
                <p className="mt-1 text-[0.8125rem] text-fg-subtle">
                  {member ? (
                    <Link
                      href={`/representatives/house-of-assembly/${member.slug}`}
                      className="font-medium text-ink-800 hover:underline"
                    >
                      {[member.honorific, member.name].filter(Boolean).join(" ")}
                    </Link>
                  ) : (
                    "Member profile pending"
                  )}
                </p>
                <Link
                  href={`/lgas/${constituency.lgaSlug}`}
                  className="mt-2 inline-block text-[0.75rem] text-fg-subtle hover:text-ink-800 hover:underline"
                >
                  {lgaName(constituency.lgaSlug)} LGA
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
