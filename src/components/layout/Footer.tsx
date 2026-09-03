import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Wordmark } from "@/components/layout/Brand";
import { footerNav, legalNav, siteConfig, siteContact, siteSocial } from "@/data/site";
import { SocialRow } from "@/components/layout/SocialRow";

/**
 * Site footer. Repeats the full information architecture so every deep page
 * offers a route to everything else, and carries the secretariat's contact
 * details as the site's canonical address block.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const hasSocial = Object.values(siteSocial).some(Boolean);

  return (
    <footer className="panel-ink paper-grain mt-auto">
      <div className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
          <div>
            <Wordmark tone="dark" size="lg" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-300">
              {siteConfig.description}
            </p>

            <address className="mt-7 space-y-3 text-sm not-italic text-ink-200">
              {siteContact.addressLines?.length ? (
                <p className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brass-400" aria-hidden="true" />
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
              {siteContact.phones?.[0] ? (
                <p className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-brass-400" aria-hidden="true" />
                  <a
                    href={`tel:${siteContact.phones[0].replace(/\s+/g, "")}`}
                    className="on-ink transition-colors hover:text-white"
                  >
                    {siteContact.phones[0]}
                  </a>
                </p>
              ) : null}
              {siteContact.emails?.[0] ? (
                <p className="flex items-center gap-3">
                  <Mail className="size-4 shrink-0 text-brass-400" aria-hidden="true" />
                  <a
                    href={`mailto:${siteContact.emails[0]}`}
                    className="on-ink transition-colors hover:text-white"
                  >
                    {siteContact.emails[0]}
                  </a>
                </p>
              ) : null}
            </address>

            {hasSocial ? <SocialRow social={siteSocial} className="mt-7" tone="dark" /> : null}
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {footerNav.map((column) => (
              <div key={column.title}>
                <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-300">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="on-ink text-sm text-ink-200 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-[0.8125rem] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalNav.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="on-ink transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
