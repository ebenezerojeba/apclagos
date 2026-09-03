import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page section shell. One component owns vertical rhythm and background
 * treatment for the whole site, so spacing stays consistent from the homepage
 * to the deepest profile page.
 */
export function Section({
  children,
  id,
  tone = "canvas",
  size = "md",
  className,
  containerClassName,
  ariaLabelledBy,
  grain = false,
}: {
  children: ReactNode;
  id?: string;
  tone?: "canvas" | "surface" | "muted" | "ink";
  size?: "sm" | "md" | "lg";
  className?: string;
  containerClassName?: string;
  ariaLabelledBy?: string;
  grain?: boolean;
}) {
  const tones = {
    canvas: "bg-canvas",
    surface: "bg-surface",
    muted: "bg-surface-muted",
    ink: "panel-ink",
  } as const;

  const sizes = {
    sm: "py-14 sm:py-16",
    md: "py-16 sm:py-20 lg:py-24",
    lg: "py-20 sm:py-28 lg:py-32",
  } as const;

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "relative",
        tones[tone],
        sizes[size],
        grain && "paper-grain",
        className,
      )}
    >
      <div className={cn("container-page", containerClassName)}>{children}</div>
    </section>
  );
}

/** A thin brass-seeded divider used between related bands. */
export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("container-page", className)}>
      <div className="rule-brass" />
    </div>
  );
}
