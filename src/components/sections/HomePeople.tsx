import Link from "next/link";
import { ArrowRight, Landmark, ScrollText, Users } from "lucide-react";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Badge, ArrowLink } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { LeaderCard, CandidateCard } from "@/components/cards/PersonCard";
import { AwaitingRecordsState } from "@/components/ui/states";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Motion";
import {
  getCouncils,
  getElectionBySlug,
  getFeaturedCandidates,
  getFeaturedLeaders,
  getHouseOfAssemblyMembers,
  getHouseOfRepresentativesMembers,
  getLcdas,
  getLgas,
  getSenators,
} from "@/lib/content";
import { currentElectionSlug } from "@/data/elections";

/* -------------------------------------------------------------------------- */
/*  Leadership                                                                 */
/* -------------------------------------------------------------------------- */

export async function LeadershipPreview() {
  const leaders = await getFeaturedLeaders(4);

  return (
    <Section tone="canvas" ariaLabelledBy="leadership-heading">
      <SectionHeader
        as="h2"
        eyebrow="Party leadership"
        title={<span id="leadership-heading">Who leads APC Lagos</span>}
        description="The officers of the state chapter and the organs through which the party is administered."
        action={
          <Button href="/leadership" variant="outline" iconRight={<ArrowRight className="size-4" />}>
            All leadership
          </Button>
        }
      />

      {leaders.length > 0 ? (
        <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => (
            <StaggerItem key={leader.slug}>
              <LeaderCard leader={leader} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <AwaitingRecordsState
          variant="compact"
          className="mt-10"
          what="Leadership profiles"
          dataFile="the admin, under Party leadership"
        />
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Councils                                                                   */
/* -------------------------------------------------------------------------- */

export async function CouncilsPreview() {
  const [lgas, lcdas, councils] = await Promise.all([
    getLgas(),
    getLcdas(),
    getCouncils(),
  ]);

  return (
    <Section tone="surface" ariaLabelledBy="councils-heading">
      <SectionHeader
        as="h2"
        eyebrow="Local government"
        title={<span id="councils-heading">All 57 local councils, in one directory</span>}
        description="Lagos State is administered through 20 Local Government Areas and 37 Local Council Development Areas. Search by name, filter by LGA, or browse alphabetically."
        action={
          <Button href="/councils" iconRight={<ArrowRight className="size-4" />}>
            Open the directory
          </Button>
        }
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10">
        <Reveal>
          <div className="rounded-2xl border border-border-subtle bg-paper-100/70 p-6 sm:p-8">
            <p className="eyebrow">
              <span aria-hidden="true" className="h-px w-5 bg-brass-400" />
              Browse councils
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {councils.map((council) => (
                <li key={`${council.councilType}-${council.slug}`}>
                  <Link
                    href={`/${council.councilType === "LGA" ? "lgas" : "lcdas"}/${council.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[0.8125rem] text-fg-muted transition-colors hover:border-ink-400 hover:text-ink-900"
                  >
                    {council.name}
                    <span
                      className={`text-[0.5625rem] font-semibold uppercase tracking-wider ${
                        council.councilType === "LGA"
                          ? "text-ink-500"
                          : "text-brass-500"
                      }`}
                    >
                      {council.councilType}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal direction="left" delay={0.1} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <CountTile
            icon={<Landmark className="size-5" />}
            value={lgas.length}
            label="Local Government Areas"
            description="Constitutionally recognised councils"
            href="/lgas"
          />
          <CountTile
            icon={<Users className="size-5" />}
            value={lcdas.length}
            label="Local Council Development Areas"
            description="Created by the Lagos State Government"
            href="/lcdas"
          />
        </Reveal>
      </div>
    </Section>
  );
}

function CountTile({
  icon,
  value,
  label,
  description,
  href,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-6 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-ink-50 text-ink-700" aria-hidden="true">
        {icon}
      </span>
      <span className="mt-6 block">
        <span className="tnum block font-display text-4xl leading-none text-fg">{value}</span>
        <span className="mt-2 block text-sm font-semibold text-crimson-700">{label}</span>
        <span className="mt-1 block text-[0.8125rem] text-fg-muted">{description}</span>
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Representatives                                                            */
/* -------------------------------------------------------------------------- */

export async function RepresentativesPreview() {
  const [senators, reps, assembly] = await Promise.all([
    getSenators(),
    getHouseOfRepresentativesMembers(),
    getHouseOfAssemblyMembers(),
  ]);

  const chambers = [
    {
      href: "/representatives/senate",
      name: "Senate",
      seats: 3,
      seatLabel: "senatorial districts",
      published: senators.length,
      description:
        "Lagos Central, Lagos East and Lagos West are each represented in the National Assembly's upper chamber.",
    },
    {
      href: "/representatives/house-of-representatives",
      name: "House of Representatives",
      seats: 24,
      seatLabel: "federal constituencies",
      published: reps.length,
      description:
        "Lagos State returns members for 24 federal constituencies to the lower chamber of the National Assembly.",
    },
    {
      href: "/representatives/house-of-assembly",
      name: "Lagos State House of Assembly",
      seats: 40,
      seatLabel: "state constituencies",
      published: assembly.length,
      description:
        "The state legislature is made up of 40 members, two from each Local Government Area.",
    },
  ];

  return (
    <Section tone="canvas" ariaLabelledBy="representatives-heading">
      <SectionHeader
        as="h2"
        eyebrow="Representation"
        title={<span id="representatives-heading">Who represents your constituency</span>}
        description="Profiles are published for each seat as the party supplies them, and are searchable by district, constituency and local government."
        action={
          <Button href="/representatives" variant="outline" iconRight={<ArrowRight className="size-4" />}>
            All representatives
          </Button>
        }
      />

      <StaggerGroup className="mt-12 grid gap-5 lg:grid-cols-3">
        {chambers.map((chamber) => (
          <StaggerItem key={chamber.href}>
            <Link
              href={chamber.href}
              className="group flex h-full flex-col rounded-2xl border border-border-subtle bg-surface p-7 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
            >
              <span className="flex items-center justify-between">
                <span className="tnum font-display text-5xl leading-none text-ink-900">
                  {chamber.seats}
                </span>
                <Badge tone={chamber.published > 0 ? "verdant" : "outline"}>
                  {chamber.published > 0
                    ? `${chamber.published} published`
                    : "Profiles pending"}
                </Badge>
              </span>
              <span className="mt-1.5 block text-[0.8125rem] text-fg-subtle">
                {chamber.seatLabel}
              </span>
              <h3 className="mt-5 font-display text-xl leading-snug text-fg">
                {chamber.name}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                {chamber.description}
              </p>
              <span className="mt-auto pt-6 text-[0.8125rem] font-semibold text-ink-700 transition-colors group-hover:text-crimson-700">
                View chamber →
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Election 2027                                                              */
/* -------------------------------------------------------------------------- */

export async function ElectionPreview() {
  const [election, candidates] = await Promise.all([
    getElectionBySlug(currentElectionSlug),
    getFeaturedCandidates(4),
  ]);

  if (!election) return null;

  return (
    <Section tone="muted" ariaLabelledBy="election-heading" grain>
      <SectionHeader
        as="h2"
        eyebrow={`Election ${election.year}`}
        title={<span id="election-heading">{election.name}</span>}
        description={election.summary}
        action={
          <Button
            href={`/elections/${election.slug}`}
            variant="secondary"
            iconRight={<ScrollText className="size-4" />}
          >
            Election hub
          </Button>
        }
      />

      {candidates.length > 0 ? (
        <>
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {candidates.map((candidate) => (
              <StaggerItem key={candidate.slug}>
                <CandidateCard candidate={candidate} />
              </StaggerItem>
            ))}
          </StaggerGroup>
          <div className="mt-8">
            <ArrowLink href="/candidates">Browse the full candidate directory</ArrowLink>
          </div>
        </>
      ) : (
        <AwaitingRecordsState
          variant="compact"
          className="mt-10"
          what="Candidate profiles"
          dataFile="the admin, under Elections"
        />
      )}
    </Section>
  );
}
