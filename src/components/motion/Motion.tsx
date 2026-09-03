"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Animation primitives.
 *
 * House rules, applied by every component here:
 *  - motion is opt-in per element, never global;
 *  - everything degrades to a static, fully legible layout when the viewer
 *    prefers reduced motion (checked via `useReducedMotion`, which framer-motion
 *    keeps in sync with the media query);
 *  - transforms and opacity only, so nothing triggers layout during scroll;
 *  - reveals fire once and then disconnect.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* -------------------------------------------------------------------------- */
/*  Reveal                                                                     */
/* -------------------------------------------------------------------------- */

type RevealDirection = "up" | "down" | "left" | "right" | "none";

const OFFSETS: Record<RevealDirection, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 20, y: 0 },
  right: { x: -20, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.7,
  as: As = "div",
  amount = 0.25,
}: {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  as?: "div" | "section" | "li" | "article" | "span" | "header";
  amount?: number;
}) {
  const reduced = useReducedMotion();
  const Component = motion[As];
  const offset = OFFSETS[direction];

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/*  Staggered groups                                                           */
/* -------------------------------------------------------------------------- */

const groupVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function StaggerGroup({
  children,
  className,
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Counter                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Counts up to `value` when scrolled into view. The final value is rendered
 * immediately for reduced-motion viewers and is always present in the DOM, so
 * screen readers and search crawlers never see a zero.
 */
export function Counter({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {prefix}
      <span aria-hidden="true">{display.toLocaleString("en-NG")}</span>
      <span className="sr-only">{value.toLocaleString("en-NG")}</span>
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Text reveal                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Reveals a headline word by word. The full string stays in the accessibility
 * tree as one label, so assistive technology reads a sentence rather than a
 * sequence of fragments.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  as: As = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "p";
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const Component = motion[As];

  if (reduced) {
    const Static = As;
    return <Static className={className}>{text}</Static>;
  }

  return (
    <Component
      className={className}
      aria-label={text}
      initial="hidden"
      animate="shown"
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: 0.045, delayChildren: delay } },
      }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%", opacity: 0 },
              shown: { y: "0%", opacity: 1, transition: { duration: 0.85, ease: EASE } },
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}

/* -------------------------------------------------------------------------- */
/*  Parallax                                                                   */
/* -------------------------------------------------------------------------- */

/** Translates its children on scroll. `distance` is in pixels of total travel. */
export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const smooth = useSpring(y, { stiffness: 120, damping: 30, mass: 0.4 });

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: smooth }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Magnetic button                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Nudges its child toward the pointer. Pointer-driven only: it never runs on
 * touch devices, and it is inert under reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.35 });

  if (reduced) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Image reveal                                                               */
/* -------------------------------------------------------------------------- */

/** Wipes a mask off an image as it scrolls into view. */
export function ImageReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      <motion.div
        initial={{ scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.4, ease: EASE, delay }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
