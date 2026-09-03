import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/sections/Section";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  { label: "All 57 local councils", href: "/councils" },
  { label: "Party leadership", href: "/leadership" },
  { label: "Elected representatives", href: "/representatives" },
  { label: "Election 2027", href: "/elections/2027" },
  { label: "News and press releases", href: "/news" },
  { label: "Contact the secretariat", href: "/contact" },
];

export default function NotFound() {
  return (
    <Section tone="canvas" size="lg">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow justify-center text-crimson-700">
          <span aria-hidden="true" className="h-px w-6 bg-crimson-400" />
          Error 404
        </p>
        <h1 className="mt-4 text-display-xl leading-tight">
          We could not find that page
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-fg-muted">
          The address may have changed, or the record may not have been published
          yet. Try the search, or start from one of the sections below.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/">Return home</Button>
          <Button href="/search" variant="outline">
            Search the site
          </Button>
        </div>

        <ul className="mt-14 grid gap-3 text-left sm:grid-cols-2">
          {SUGGESTIONS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-xl border border-border-subtle bg-surface px-4 py-3.5 text-sm font-medium text-fg transition-colors hover:border-border-strong hover:bg-paper-100"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
