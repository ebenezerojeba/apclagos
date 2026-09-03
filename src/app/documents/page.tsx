import type { Metadata } from "next";
import { PageHeader, HeaderFacts } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/ui/primitives";
import { DocumentCard } from "@/components/cards/ContentCards";
import { AwaitingRecordsState } from "@/components/ui/states";
import { getDocuments } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { documentCategoryLabels } from "@/lib/labels";
import { groupBy } from "@/lib/utils";
import type { DocumentCategory } from "@/types/content";

export const metadata: Metadata = buildMetadata({
  title: "Documents",
  description:
    "Official documents published by APC Lagos — the party constitution, policies, guidelines, forms and reports.",
  path: "/documents",
  keywords: ["APC constitution", "APC Lagos documents", "APC Lagos forms"],
});

export default async function DocumentsPage() {
  const documents = await getDocuments();
  const grouped = groupBy(documents, (doc) => doc.category as DocumentCategory);
  const order = Object.keys(documentCategoryLabels) as DocumentCategory[];

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Documents"
        description="Official documents published by the state chapter. Each entry shows its file type and size before you download it."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Documents", href: "/documents" },
        ]}
      >
        <HeaderFacts
          items={[
            { label: "Published documents", value: documents.length },
            { label: "Categories", value: Object.keys(grouped).length },
            { label: "Press releases", value: "See newsroom" },
            { label: "Contact", value: "Secretariat" },
          ]}
        />
      </PageHeader>

      <Section tone="canvas">
        {documents.length === 0 ? (
          <AwaitingRecordsState
            what="Documents"
            dataFile="src/data/resources.ts"
          />
        ) : (
          <div className="space-y-14">
            {order
              .filter((category) => grouped[category]?.length)
              .map((category) => (
                <section key={category} aria-labelledby={`documents-${category}`}>
                  <SectionHeader
                    as="h2"
                    title={
                      <span id={`documents-${category}`}>
                        {documentCategoryLabels[category]}
                      </span>
                    }
                  />
                  <ul className="mt-6 grid gap-4 lg:grid-cols-2">
                    {grouped[category].map((doc) => (
                      <li key={doc.slug}>
                        <DocumentCard document={doc} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </Section>
    </>
  );
}
