import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { PersonDirectory, type PersonFacet } from "@/components/directories/PersonDirectory";
import { JsonLd } from "@/components/ui/primitives";
import {
  getCandidates,
  getElections,
  getFederalConstituencies,
  getLgas,
  getSenatorialDistricts,
  getStateConstituencies,
} from "@/lib/content";
import { buildMetadata, itemListJsonLd } from "@/lib/seo";
import { electionOfficeLabels, optionsFrom } from "@/lib/labels";
import type { Candidate, ElectionOffice } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Candidate directory",
  description:
    "APC Lagos candidates by election, office, senatorial district, federal constituency, state constituency and local government.",
  path: "/candidates",
  keywords: [
    "APC Lagos candidates",
    "Lagos 2027 candidates",
    "APC governorship candidate Lagos",
  ],
});

export default async function CandidatesPage() {
  const [candidates, elections, districts, federal, state, lgas] =
    await Promise.all([
      getCandidates(),
      getElections(),
      getSenatorialDistricts(),
      getFederalConstituencies(),
      getStateConstituencies(),
      getLgas(),
    ]);

  const offices = candidates.map((c) => c.office) as ElectionOffice[];

  const countBy = (
    predicate: (candidate: Candidate, value: string) => boolean,
    value: string,
  ) => candidates.filter((c) => predicate(c, value)).length;

  const facets: PersonFacet[] = [
    {
      id: "office",
      label: "Office contested",
      display: "chips",
      field: "office",
      allLabel: "All offices",
      options: optionsFrom(electionOfficeLabels, offices),
    },
    {
      id: "election",
      label: "Election",
      display: "select",
      field: "electionSlug",
      allLabel: "All elections",
      options: elections.map((election) => ({
        value: election.slug,
        label: election.name,
        count: countBy((c, v) => c.electionSlug === v, election.slug),
      })),
    },
    {
      id: "district",
      label: "Senatorial district",
      display: "select",
      field: "senatorialDistrictSlug",
      allLabel: "All districts",
      options: districts.map((d) => ({
        value: d.slug,
        label: d.name.replace(" Senatorial District", ""),
        count: countBy((c, v) => c.senatorialDistrictSlug === v, d.slug),
      })),
    },
    {
      id: "federal",
      label: "Federal constituency",
      display: "select",
      field: "federalConstituencySlug",
      allLabel: "All federal constituencies",
      options: federal.map((f) => ({
        value: f.slug,
        label: f.name.replace(" Federal Constituency", ""),
        count: countBy((c, v) => c.federalConstituencySlug === v, f.slug),
      })),
    },
    {
      id: "state",
      label: "State constituency",
      display: "select",
      field: "stateConstituencySlug",
      allLabel: "All state constituencies",
      options: state.map((s) => ({
        value: s.slug,
        label: s.name,
        count: countBy((c, v) => c.stateConstituencySlug === v, s.slug),
      })),
    },
    {
      id: "lga",
      label: "Local government",
      display: "select",
      field: "lgaSlug",
      allLabel: "All local governments",
      options: lgas.map((lga) => ({
        value: lga.slug,
        label: lga.name,
        count: countBy((c, v) => c.lgaSlug === v, lga.slug),
      })),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Elections"
        title="Candidate directory"
        description="Candidates fielded by APC Lagos, filterable by election, office and constituency. Profiles are published as each nomination is confirmed by the party and filed with the Independent National Electoral Commission."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Candidates", href: "/candidates" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Published candidates", value: candidates.length },
            { label: "Election cycles", value: elections.length },
            { label: "Federal constituencies", value: federal.length },
            { label: "State constituencies", value: state.length },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {candidates.length > 0 ? (
          <JsonLd
            data={itemListJsonLd({
              name: "APC Lagos candidates",
              items: candidates.map((candidate) => ({
                name: candidate.name,
                href: `/candidates/${candidate.slug}`,
              })),
            })}
          />
        ) : null}

        <PersonDirectory
          rows={candidates.map((candidate) => ({
            person: candidate,
            href: `/candidates/${candidate.slug}`,
            context: candidate.contestedSeat,
          }))}
          facets={facets}
          noun="candidate"
          emptyWhat="Candidate profiles"
          searchPlaceholder="Search candidate, office or constituency…"
        />
      </Section>
    </>
  );
}
