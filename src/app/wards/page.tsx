import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/states";
import { getLcdas, getLgas, getWards } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { groupBy } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Political wards",
  description:
    "All 376 wards of Lagos State, across the 20 Local Government Areas and the 37 LCDAs carved out of them - the base unit of the party structure.",
  path: "/wards",
  keywords: ["Lagos wards", "Lagos ward delimitation", "APC Lagos ward structure"],
});

export default async function WardsPage() {
  const [wards, lgas, lcdas] = await Promise.all([getWards(), getLgas(), getLcdas()]);
  const byLga = groupBy(wards, (ward) => ward.lgaSlug);
  const pollingUnits = wards.reduce((sum, ward) => sum + (ward.pollingUnits ?? 0), 0);
  // A ward inside an LCDA is filed under its parent LGA, so the LCDA's name is
  // shown on the chip - otherwise 226 of the 376 wards look like they belong
  // directly to a local government they were carved out of.
  const lcdaName = new Map(lcdas.map((lcda) => [lcda.slug, lcda.name]));

  return (
    <>
      <PageHeader
        eyebrow="Political structure"
        title="Political wards"
        description="The ward is the base unit of the party structure: congresses begin here, and every member is registered in one. Lagos State is delimited into 376 wards across 57 administrative councils - the 20 Local Government Areas and the 37 Local Council Development Areas carved out of them. Wards are listed below under their local government."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Local Councils", href: "/councils" },
          { name: "Wards", href: "/wards" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Wards", value: wards.length || "Pending" },
            { label: "Polling units", value: pollingUnits.toLocaleString("en-NG") },
            { label: "Local Government Areas", value: lgas.length },
            { label: "LCDAs", value: lcdas.length },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {wards.length === 0 ? (
          <>
            <EmptyState
              title="The ward register is not loaded"
              description={
                <>
                  The register lives at{" "}
                  <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                    src/data/lagos-wards.json
                  </code>{" "}
                  and is mapped in{" "}
                  <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                    src/data/wards.ts
                  </code>
                  . Run{" "}
                  <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-800">
                    npm run verify:wards
                  </code>{" "}
                  to check the mapping against the register&rsquo;s own totals.
                </>
              }
            />

            <SectionHeader
              as="h2"
              className="mt-16"
              eyebrow="Meanwhile"
              title="Browse by local government"
              description="Each Local Government Area page shows its LCDAs, constituencies and — once published — its wards."
            />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {lgas.map((lga) => (
                <li key={lga.slug}>
                  <Link
                    href={`/lgas/${lga.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3.5 text-sm font-medium text-fg transition-colors hover:border-border-strong hover:bg-paper-100"
                  >
                    {lga.name}
                    <span className="tnum text-xs text-fg-subtle">
                      {lga.lcdaSlugs.length} LCDAs
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="space-y-12">
            {lgas
              .filter((lga) => byLga[lga.slug]?.length)
              .map((lga) => (
                <section key={lga.slug} aria-labelledby={`wards-${lga.slug}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2
                      id={`wards-${lga.slug}`}
                      className="font-display text-2xl text-fg"
                    >
                      <Link href={`/lgas/${lga.slug}`} className="hover:underline">
                        {lga.name}
                      </Link>
                    </h2>
                    <span className="tnum text-sm text-fg-subtle">
                      {byLga[lga.slug].length} wards ·{" "}
                      {byLga[lga.slug]
                        .reduce((sum, ward) => sum + (ward.pollingUnits ?? 0), 0)
                        .toLocaleString("en-NG")}{" "}
                      polling units
                    </span>
                  </div>
                  <Card className="mt-4 p-5">
                    <ul className="flex flex-wrap gap-2">
                      {byLga[lga.slug].map((ward) => (
                        <li key={ward.slug} id={ward.slug}>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-paper-100 px-3 py-1.5 text-[0.8125rem] text-fg-muted">
                            {ward.code ? (
                              <span className="tnum font-semibold text-ink-700">
                                {ward.code}
                              </span>
                            ) : null}
                            <span className="text-fg">{ward.name}</span>
                            {ward.lcdaSlug ? (
                              <span className="text-xs text-fg-subtle">
                                {lcdaName.get(ward.lcdaSlug) ?? ward.lcdaSlug}
                              </span>
                            ) : null}
                            {ward.pollingUnits ? (
                              <span className="tnum text-xs text-fg-subtle">
                                {ward.pollingUnits} PU
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </section>
              ))}
          </div>
        )}
      </Section>
    </>
  );
}
