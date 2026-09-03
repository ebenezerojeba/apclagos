import { Facebook, Globe, Instagram, Linkedin, Youtube } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { SocialLinks } from "@/types/content";

/** X has no lucide glyph, so it is drawn inline to match the icon weight. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const CHANNELS: {
  key: keyof SocialLinks;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "x", label: "X", Icon: XIcon },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "website", label: "Website", Icon: Globe },
];

export function SocialRow({
  social,
  tone = "light",
  className,
  personName,
}: {
  social: SocialLinks;
  tone?: "light" | "dark";
  className?: string;
  /** Included in link labels so multiple rows on one page stay distinguishable. */
  personName?: string;
}) {
  const available = CHANNELS.filter(({ key }) => Boolean(social[key]));
  if (available.length === 0) return null;

  const dark = tone === "dark";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {available.map(({ key, label, Icon }) => (
        <li key={key}>
          <a
            href={social[key]}
            target="_blank"
            rel="noopener noreferrer me"
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-colors",
              dark
                ? "on-ink bg-white/8 text-ink-200 hover:bg-white/16 hover:text-white"
                : "border border-border bg-surface text-fg-muted hover:border-border-strong hover:text-ink-900",
            )}
          >
            <Icon className="size-4" />
            <span className="sr-only">
              {personName ? `${personName} on ${label}` : label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
