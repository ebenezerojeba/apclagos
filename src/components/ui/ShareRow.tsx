"use client";

import { Check, Facebook, Link2, Linkedin, Mail } from "lucide-react";
import { useCopyToClipboard } from "@/hooks";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Share controls for articles and events.
 *
 * Every target is a plain link to the network's own share endpoint — no
 * third-party share widget, no tracking script, nothing loaded on page view.
 */
export function ShareRow({
  title,
  path,
  className,
}: {
  title: string;
  /** Site-relative path; the canonical origin is added here. */
  path: string;
  className?: string;
}) {
  const url = `${siteConfig.url}${path}`;
  const { copied, copy } = useCopyToClipboard();

  const targets = [
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <Facebook className="size-4" />,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <Linkedin className="size-4" />,
    },
    {
      label: "Share by email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
      icon: <Mail className="size-4" />,
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-ink-900"
        >
          <span aria-hidden="true">{target.icon}</span>
          <span className="sr-only">{target.label}</span>
        </a>
      ))}
      <button
        type="button"
        onClick={() => copy(url)}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-ink-900"
      >
        <span aria-hidden="true">
          {copied ? (
            <Check className="size-4 text-verdant-600" />
          ) : (
            <Link2 className="size-4" />
          )}
        </span>
        <span className="sr-only">
          {copied ? "Link copied" : "Copy link to this page"}
        </span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
