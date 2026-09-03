import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One button surface for the whole site, rendered as a `<button>` or a
 * `<Link>`/`<a>` depending on whether an href is supplied — so a control that
 * navigates is always a real link and a control that acts is always a button.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "inverse"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex items-center justify-center gap-2 font-sans font-semibold " +
  "tracking-tight whitespace-nowrap rounded-full transition-[background-color,color,border-color,box-shadow,transform] " +
  "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-900 text-white shadow-[0_1px_2px_rgb(13_27_49/0.25)] hover:bg-ink-800 hover:shadow-[0_10px_28px_-12px_rgb(13_27_49/0.6)]",
  secondary:
    "bg-crimson-700 text-white hover:bg-crimson-600 shadow-[0_1px_2px_rgb(104_27_35/0.3)] hover:shadow-[0_10px_28px_-12px_rgb(151_27_38/0.65)]",
  outline:
    "border border-border-strong bg-surface text-ink-900 hover:border-ink-700 hover:bg-paper-100",
  ghost: "text-ink-800 hover:bg-ink-50",
  inverse:
    "bg-white text-ink-950 hover:bg-paper-100 shadow-[0_10px_30px_-16px_rgb(0_0_0/0.7)]",
  danger: "bg-crimson-700 text-white hover:bg-crimson-800",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[0.9375rem]",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  /** Rendered before the label — pass a lucide icon. */
  iconLeft?: ReactNode;
  /** Rendered after the label. */
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<"a">, "className" | "children" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    iconLeft,
    iconRight,
    fullWidth,
  } = props;

  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {iconLeft ? (
        <span className="shrink-0" aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      {iconRight ? (
        <span className="shrink-0" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </>
  );

  // Strip the presentational props so only real DOM attributes are forwarded.
  const rest = omitStyleProps(props);

  if (typeof props.href === "string") {
    const href = props.href;
    const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");

    if (isExternal) {
      return (
        <a
          {...(rest as ComponentPropsWithoutRef<"a">)}
          href={href}
          className={classes}
          rel="noopener noreferrer"
          target={href.startsWith("mailto:") ? undefined : "_blank"}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        {...(rest as Omit<ComponentPropsWithoutRef<"a">, "href">)}
        href={href}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      {...(rest as ComponentPropsWithoutRef<"button">)}
      type={props.type ?? "button"}
      className={classes}
    >
      {content}
    </button>
  );
}

const STYLE_PROP_KEYS = [
  "variant",
  "size",
  "className",
  "children",
  "iconLeft",
  "iconRight",
  "fullWidth",
  "href",
] as const;

/** Removes this component's own props so the rest can be spread onto the DOM. */
function omitStyleProps(props: ButtonProps): Record<string, unknown> {
  const out: Record<string, unknown> = { ...props };
  for (const key of STYLE_PROP_KEYS) delete out[key];
  return out;
}
