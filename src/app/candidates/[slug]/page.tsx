import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/sections/PageHeader";
import { PersonProfile, personFacts } from "@/components/sections/PersonProfile";
import { JsonLd, Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import {
  getCandidateBySlug,
  getCandidates,
  getElectionBySlug,
  getGalleryAlbums,
  getNews,
} from "@/lib/content";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { electionOfficeLabels } from "@/lib/labels";

export async function generateStaticParams() {
  const candidates = await getCandidates();
  return candidates.map((candidate) => ({ slug: candidate.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const candidate = await getCandidateBySlug(slug);
  if (!candidate) return { title: "Candidate not found" };

  const name = [candidate.honorific, candidate.name].filter(Boolean).join(" ");

  return buildMetadata({
    title: `${name} — ${candidate.position}`,
    description:
      candidate.summary ??
      `${name}, APC Lagos candidate for ${candidate.contestedSeat ?? candidate.position}.`,
    path: `/candidates/${candidate.slug}`,
    image: candidate.portrait?.src,
    imageAlt: candidate.portrait?.alt,
    type: "profile",
  });
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const candidate = await getCandidateBySlug(slug);
  if (!candidate) notFound();

  const [election, news, albums, runningMate] = await Promise.all([
    getElectionBySlug(candidate.electionSlug),
    getNews(),
    getGalleryAlbums(),
    candidate.runningMateSlug
      ? getCandidateBySlug(candidate.runningMateSlug)
      : Promise.resolve(undefined),
  ]);

  const relatedNews = news
    .filter((article) => article.relatedPersonSlugs?.includes(candidate.slug))
    .slice(0, 3);
  const relatedAlbums = albums.filter((album) =>
    candidate.galleryAlbumSlugs?.includes(album.slug),
  );

  const name = [candidate.honorific, candidate.name].filter(Boolean).join(" ");
  const fullName = candidate.postNominals
    ? `${name}, ${candidate.postNominals}`
    : name;

  return (
    <>
      <JsonLd
        data={personJsonLd({
          name: fullName,
          jobTitle: `Candidate for ${candidate.contestedSeat ?? candidate.position}`,
          description: candidate.summary,
          image: candidate.portrait?.src,
          path: `/candidates/${candidate.slug}`,
        })}
      />

      <PageHeader
        eyebrow={election ? election.name : "Candidate"}
        title={fullName}
        description={
          candidate.contestedSeat
            ? `${candidate.position} · ${candidate.contestedSeat}`
            : candidate.position
        }
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Candidates", href: "/candidates" },
          { name: candidate.name, href: `/candidates/${candidate.slug}` },
        ]}
        aside={
          <Button href="/candidates" variant="inverse" size="sm">
            All candidates
          </Button>
        }
      />

      <PersonProfile
        person={candidate}
        facts={personFacts(candidate, [
          { label: "Office contested", value: electionOfficeLabels[candidate.office] },
          ...(candidate.contestedSeat
            ? [{ label: "Seat", value: candidate.contestedSeat }]
            : []),
          ...(election ? [{ label: "Election", value: election.name }] : []),
          ...(candidate.result
            ? [
                {
                  label: "Result",
                  value: (
                    <Badge
                      tone={
                        candidate.result.outcome === "won"
                          ? "verdant"
                          : candidate.result.outcome === "pending"
                            ? "outline"
                            : "neutral"
                      }
                    >
                      {candidate.result.outcome}
                    </Badge>
                  ),
                },
              ]
            : []),
          ...(runningMate
            ? [
                {
                  label: "Running mate",
                  value: (
                    <a
                      href={`/candidates/${runningMate.slug}`}
                      className="text-ink-800 underline-offset-4 hover:underline"
                    >
                      {[runningMate.honorific, runningMate.name]
                        .filter(Boolean)
                        .join(" ")}
                    </a>
                  ),
                },
              ]
            : []),
        ])}
        news={relatedNews}
        albums={relatedAlbums}
        extraSections={
          <>
            {candidate.keyPriorities?.length ? (
              <div className="mt-12">
                <h3 className="font-display text-xl text-fg">Key priorities</h3>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {candidate.keyPriorities.map((priority, index) => (
                    <li key={priority.title}>
                      <Card className="h-full p-5">
                        <span className="tnum text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h4 className="mt-2 font-display text-lg text-fg">
                          {priority.title}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                          {priority.description}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {candidate.manifesto?.length ? (
              <div className="mt-12">
                <h3 className="font-display text-xl text-fg">Manifesto</h3>
                <div className="prose-institutional mt-5">
                  {candidate.manifesto.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        }
      />
    </>
  );
}
