import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader, Card, JsonLd } from "@/components/ui/primitives";
import { ContactForm } from "@/components/forms/ContactForm";
import { SocialRow } from "@/components/layout/SocialRow";
import { issueFormToken } from "@/lib/server/contact";
import { siteConfig, siteContact, siteSocial } from "@/data/site";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact APC Lagos",
  description:
    "Contact the APC Lagos State secretariat — office address, telephone, email, social channels and an enquiry form for membership, media and council enquiries.",
  path: "/contact",
  keywords: ["APC Lagos contact", "APC Lagos secretariat", "APC Lagos address"],
});

/** The signed token is minted per request, so it is never cached. */
export const dynamic = "force-dynamic";

export default function ContactPage() {
  const token = issueFormToken();
  const mapQuery = encodeURIComponent(
    siteContact.mapQuery ?? "Lagos State, Nigeria",
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `Contact ${siteConfig.name}`,
          url: absoluteUrl("/contact"),
          mainEntity: {
            "@type": "Organization",
            name: siteConfig.legalName,
            url: siteConfig.url,
            email: siteContact.emails?.[0],
            telephone: siteContact.phones?.[0],
            address: {
              "@type": "PostalAddress",
              streetAddress: siteContact.addressLines?.join(", "),
              addressLocality: siteContact.city,
              addressRegion: siteContact.state,
              addressCountry: "NG",
            },
          },
        }}
      />

      <PageHeader
        eyebrow="Get in touch"
        title="Contact the secretariat"
        description="For party enquiries, membership questions, media requests or corrections to information published on this platform."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <Section tone="canvas">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div>
            <SectionHeader
              as="h2"
              eyebrow="Enquiry form"
              title="Send a message"
              description="Messages are routed to the relevant office. Please allow a few working days for a response."
              className="mb-8"
            />
            <ContactForm token={token} />
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg text-fg">Secretariat</h2>
              <address className="mt-5 space-y-4 text-sm not-italic">
                {siteContact.addressLines?.length ? (
                  <p className="flex gap-3 text-fg-muted">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-brass-500"
                      aria-hidden="true"
                    />
                    <span>
                      {siteContact.addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                      {siteContact.city ? (
                        <span className="block">
                          {siteContact.city}
                          {siteContact.state ? `, ${siteContact.state}` : ""}
                        </span>
                      ) : null}
                    </span>
                  </p>
                ) : null}
                {siteContact.phones?.map((phone) => (
                  <p key={phone} className="flex items-center gap-3">
                    <Phone
                      className="size-4 shrink-0 text-brass-500"
                      aria-hidden="true"
                    />
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="text-ink-800 underline-offset-4 hover:underline"
                    >
                      {phone}
                    </a>
                  </p>
                ))}
                {siteContact.emails?.map((email) => (
                  <p key={email} className="flex items-center gap-3">
                    <Mail
                      className="size-4 shrink-0 text-brass-500"
                      aria-hidden="true"
                    />
                    <a
                      href={`mailto:${email}`}
                      className="break-all text-ink-800 underline-offset-4 hover:underline"
                    >
                      {email}
                    </a>
                  </p>
                ))}
                {siteContact.openingHours ? (
                  <p className="flex items-start gap-3 text-fg-muted">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-brass-500"
                      aria-hidden="true"
                    />
                    <span>{siteContact.openingHours}</span>
                  </p>
                ) : null}
              </address>

              {Object.values(siteSocial).some(Boolean) ? (
                <div className="mt-6 border-t border-border-subtle pt-5">
                  <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.13em] text-fg-subtle">
                    Official channels
                  </h3>
                  <SocialRow social={siteSocial} className="mt-3" />
                </div>
              ) : null}
            </Card>

            <Card className="overflow-hidden p-0">
              <h2 className="px-6 pb-3 pt-6 font-display text-lg text-fg">
                Find the office
              </h2>
              {/*
                The embed sits over a styled fallback. If a viewer blocks
                third-party frames — or the embed simply fails — the panel still
                reads as a finished card with a working link, rather than as a
                blank rectangle.
              */}
              <div className="relative h-72 w-full bg-paper-200">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <MapPin className="size-6 text-paper-600" aria-hidden="true" />
                  <p className="text-sm text-fg-muted">
                    {siteContact.mapQuery ?? "Lagos State, Nigeria"}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-ink-800 underline-offset-4 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
                <iframe
                  title="Map showing the location of the APC Lagos State secretariat"
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 size-full border-0"
                />
              </div>
              <p className="px-6 py-4 text-xs leading-relaxed text-fg-subtle">
                Map location is derived from the address above. Update it in{" "}
                <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-800">
                  src/data/site.ts
                </code>
                .
              </p>
            </Card>
          </aside>
        </div>
      </Section>
    </>
  );
}
