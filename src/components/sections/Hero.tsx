"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowLeft, ArrowRight, MoveDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Counter, Magnetic, SplitText } from "@/components/motion/Motion";
import { heroFallback, heroSettings, heroSlides } from "@/data/homepage";
import { usePrefersReducedMotion } from "@/hooks";
import { cn } from "@/lib/utils";
import type { StatItem } from "@/types/content";

/** The WebGL layer is a separate chunk and never ships with the initial JS. */
const HeroField = dynamic(() => import("@/components/three/HeroField"), {
  ssr: false,
});

const EASE = [0.22, 1, 0.36, 1] as const;

/** Per-slide tint, chosen from the photograph's brightness. */
const OVERLAY_OPACITY = { light: 0.1, medium: 0.24, heavy: 0.34 } as const;

/**
 * Homepage hero.
 *
 * A sequenced slide deck rather than a carousel: Lagos, then the leadership,
 * then the party at work. Four layers move independently so the whole thing
 * reads as one continuous scene —
 *
 *   1. the photograph, holding a slow 1.00 → 1.06 push with a little drift;
 *   2. layered gradients that keep white type legible over any frame;
 *   3. an optional WebGL depth field, kept faint behind the glass;
 *   4. the type, which exits and re-enters on its own timing.
 *
 * The crossfade is stacked rather than cross-dissolved: the incoming frame
 * fades in *above* the outgoing one, which stays opaque underneath. Two frames
 * fading past each other would dip below full opacity at the midpoint and flash
 * the dark base through; this way there is no flash at all.
 *
 * Autoplay stops when the viewer interacts, when the hero scrolls away, and
 * when the tab is hidden. Under `prefers-reduced-motion` it never starts, the
 * push and drift are dropped, and the controls still work.
 */
export function Hero({ stats }: { stats: StatItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const prefersReduced = useReducedMotion();

  const slides = heroSlides;
  const count = slides.length;
  const hasSlides = count > 0;
  const isCarousel = count > 1;

  /**
   * `prev` is kept so the outgoing frame can stay painted underneath the
   * incoming one for the length of the dissolve.
   */
  const [{ index, prev }, setSlide] = useState({ index: 0, prev: -1 });

  const [interacting, setInteracting] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [mountField, setMountField] = useState(false);
  /**
   * Announce slide changes only once the viewer has taken control. While
   * autoplay is running, a live region would narrate the page every few
   * seconds unprompted.
   */
  const [userControlled, setUserControlled] = useState(false);

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setSlide((s) => ({
        index: (s.index + delta + count) % count,
        prev: s.index,
      }));
    },
    [count],
  );

  const goTo = useCallback((next: number) => {
    setSlide((s) => (s.index === next ? s : { index: next, prev: s.index }));
  }, []);

  /** Any manual navigation also flags the deck as user-controlled. */
  const take = useCallback(
    (action: () => void) => {
      setUserControlled(true);
      action();
    },
    [],
  );

  const autoplaying =
    isCarousel && !reduced && !interacting && inView && tabVisible;

  // Advance. Re-arming on `index` is deliberate: each slide gets a full hold,
  // and an unrelated re-render cannot restart the timer because nothing else
  // in the dependency list changes on render.
  useEffect(() => {
    if (!autoplaying) return;
    const timer = window.setTimeout(() => step(1), heroSettings.intervalMs);
    return () => window.clearTimeout(timer);
  }, [autoplaying, index, step]);

  // Pause with the tab.
  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  // Pause — and stop the WebGL frame loop — once the hero scrolls away.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !reduced) setMountField(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  // Scroll parallax on the whole composition.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  /* -- Swipe ------------------------------------------------------------- */
  const drag = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(event: React.PointerEvent) {
    if (!isCarousel) return;
    drag.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: React.PointerEvent) {
    const start = drag.current;
    drag.current = null;
    if (!start || !isCarousel) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Horizontal intent only, so a vertical scroll never flips the slide.
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    take(() => step(dx < 0 ? 1 : -1));
  }

  /* -- Keyboard ---------------------------------------------------------- */
  function onKeyDown(event: React.KeyboardEvent) {
    if (!isCarousel) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      take(() => step(1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      take(() => step(-1));
    }
  }

  const active = hasSlides ? slides[index] : undefined;
  const copy = active ?? heroFallback;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "panel-ink relative isolate flex min-h-[32rem] flex-col overflow-hidden",
        "sm:min-h-[38rem] lg:min-h-[min(88svh,50rem)]",
      )}
      style={
        { "--hero-interval": `${heroSettings.intervalMs}ms` } as React.CSSProperties
      }
      aria-labelledby="hero-heading"
      aria-roledescription={isCarousel ? "carousel" : undefined}
      aria-label={isCarousel ? "APC Lagos featured slides" : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteracting(false);
        }
      }}
    >
      {/* Layer 1 — the photographs */}
      {hasSlides ? (
        <motion.div
          aria-hidden="true"
          style={prefersReduced ? undefined : { y: mediaY }}
          className="absolute inset-0 -z-30"
        >
          {slides.map((slide, i) => {
            const isActive = i === index;
            const isOutgoing = i === prev && prev !== index;
            // Everything else sits inert at zero, behind both.
            const z = isActive ? "z-20" : isOutgoing ? "z-10" : "z-0";

            return (
              <motion.div
                key={slide.id}
                className={cn("absolute inset-0", z)}
                initial={false}
                animate={{ opacity: isActive || isOutgoing ? 1 : 0 }}
                transition={{
                  duration: isActive
                    ? heroSettings.transitionMs / 1000
                    : 0,
                  ease: "linear",
                  // The outgoing frame only clears once the new one is solid.
                  delay: isOutgoing ? heroSettings.transitionMs / 1000 : 0,
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={
                    prefersReduced
                      ? { scale: 1, x: 0 }
                      : { scale: isActive ? 1.06 : 1, x: isActive ? "-1.2%" : "0%" }
                  }
                  transition={{
                    duration: prefersReduced
                      ? 0
                      : (heroSettings.intervalMs + heroSettings.transitionMs) / 1000,
                    ease: "linear",
                  }}
                >
                  <Image
                    src={slide.image.src}
                    alt=""
                    fill
                    // Only the first frame is on the critical path; the rest
                    // stream in behind it while the viewer reads slide one.
                    priority={i === 0}
                    loading={i === 0 ? undefined : "lazy"}
                    sizes="100vw"
                    quality={82}
                    className="size-full object-cover [object-position:var(--focus-mobile)] sm:[object-position:var(--focus)]"
                    style={
                      {
                        "--focus": slide.focus,
                        "--focus-mobile": slide.focusMobile,
                      } as React.CSSProperties
                    }
                  />
                  {/* Per-slide tint, set from how bright the frame is. */}
                  <div
                    className="absolute inset-0 bg-ink-950"
                    style={{ opacity: OVERLAY_OPACITY[slide.overlay] }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : null}

      {/* Layer 2 — WebGL depth, kept faint so it never competes with a face */}
      {mountField && !reduced ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-20",
            hasSlides ? "opacity-30" : "opacity-70",
          )}
        >
          <HeroField active={inView && tabVisible} />
        </div>
      ) : null}

      {/* Layer 3 — the gradients that carry the type */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        {/*
          Two reading gradients, because the type is laid out differently at
          each size. On wide screens it sits left, so the ground darkens to the
          left and the photograph keeps the right of the frame. On phones the
          type stacks down the middle, so a horizontal gradient would swallow
          the whole picture — there the ground darkens downward instead, which
          leaves the top of every photograph readable.
        */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-ink-950/94 via-ink-950/58 to-ink-950/15 sm:block" />
        <div
          className="absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgb(6 15 30 / 0.34) 0%, rgb(6 15 30 / 0.62) 38%, rgb(6 15 30 / 0.86) 100%)",
          }}
        />
        {/*
          Vertical seat for the stats and controls. The mid-band is kept light
          on purpose: that is where faces fall in the group photographs, and a
          flat bottom-heavy fade would put them in shadow.
        */}
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(to bottom, rgb(6 15 30 / 0.55) 0%, rgb(6 15 30 / 0.10) 34%, rgb(6 15 30 / 0.28) 62%, rgb(6 15 30 / 0.86) 100%)",
          }}
        />

        {!hasSlides ? (
          <>
            <div
              className={cn(
                "absolute -left-[15%] top-[-30%] size-[45rem] rounded-full bg-ink-600/25 blur-[120px]",
                !reduced && "motion-safe:animate-[apc-drift_18s_ease-in-out_infinite]",
              )}
            />
            <div
              className={cn(
                "absolute -right-[10%] bottom-[-35%] size-[38rem] rounded-full bg-crimson-800/25 blur-[130px]",
                !reduced &&
                  "motion-safe:animate-[apc-drift_22s_ease-in-out_infinite_reverse]",
              )}
            />
          </>
        ) : null}

        {/* The institutional grid, barely there. */}
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(255 255 255 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.5) 1px, transparent 1px)",
            backgroundSize: "clamp(3rem, 6vw, 5.5rem) clamp(3rem, 6vw, 5.5rem)",
            maskImage: "radial-gradient(120% 80% at 50% 0%, black 10%, transparent 72%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-950" />
      </div>

      {/* Layer 4 — the type */}
      <motion.div
        style={prefersReduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="container-page relative flex flex-1 flex-col pb-7 pt-16 sm:pb-8 sm:pt-24 lg:pb-10 lg:pt-32"
      >
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id ?? "fallback"}
              className="max-w-4xl"
              initial={
                prefersReduced ? false : { opacity: 0, y: 26, filter: "blur(6px)" }
              }
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                prefersReduced
                  ? { opacity: 1 }
                  : {
                      opacity: 0,
                      y: -18,
                      filter: "blur(4px)",
                      // Quicker than the entry: the deck should never feel
                      // like it is waiting for itself.
                      transition: { duration: 0.32, ease: "easeIn" },
                    }
              }
              transition={{ duration: prefersReduced ? 0 : 0.55, ease: EASE }}
            >
              <p className="eyebrow text-brass-300">
                <span aria-hidden="true" className="h-px w-8 bg-brass-400" />
                {copy.eyebrow}
              </p>

              <h1
                id="hero-heading"
                className="mt-5 text-display-2xl font-normal leading-[0.98] tracking-[-0.02em] text-white sm:mt-6 [text-shadow:0_2px_30px_rgb(6_15_30/0.5)]"
              >
                <SplitText text={copy.headline} delay={0.1} />
              </h1>

              <motion.p
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReduced ? 0 : 0.7,
                  delay: prefersReduced ? 0 : 0.28,
                  ease: EASE,
                }}
                className="mt-6 max-w-2xl text-base leading-relaxed text-ink-100 sm:mt-7 sm:text-lg [text-shadow:0_1px_16px_rgb(6_15_30/0.6)]"
              >
                {copy.supporting}
              </motion.p>

              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReduced ? 0 : 0.7,
                  delay: prefersReduced ? 0 : 0.42,
                  ease: EASE,
                }}
                className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center"
              >
                <Magnetic>
                  <Button
                    href={copy.primaryCta.href}
                    variant="inverse"
                    size="lg"
                    iconRight={<ArrowRight className="size-4" />}
                    className="w-full sm:w-auto"
                  >
                    {copy.primaryCta.label}
                  </Button>
                </Magnetic>
                <Button
                  href={copy.secondaryCta.href}
                  size="lg"
                  variant="ghost"
                  className="on-ink w-full border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 sm:w-auto"
                >
                  {copy.secondaryCta.label}
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Statistics strip — shared across slides, so it never re-animates. */}
        {stats.length > 0 ? (
          <motion.dl
            initial={prefersReduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReduced ? 0 : 0.9,
              delay: prefersReduced ? 0 : 0.75,
              ease: EASE,
            }}
            className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/12 pt-6 sm:mt-14 sm:gap-y-8 sm:pt-8 lg:grid-cols-4 lg:gap-x-10"
          >
            {stats.map((stat) => (
              <div key={stat.id}>
                <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-300">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] leading-none text-white">
                  <Counter value={stat.value} />
                </dd>
              </div>
            ))}
          </motion.dl>
        ) : null}

        {/* Controls */}
        {isCarousel ? (
          <HeroControls
            slides={slides}
            index={index}
            autoplaying={autoplaying}
            onPrev={() => take(() => step(-1))}
            onNext={() => take(() => step(1))}
            onSelect={(i) => take(() => goTo(i))}
          />
        ) : null}
      </motion.div>

      {/* Announced only once the viewer is driving the deck. */}
      <p aria-live={userControlled ? "polite" : "off"} className="sr-only">
        {hasSlides
          ? `Slide ${index + 1} of ${count}: ${slides[index].label}`
          : ""}
      </p>

      {/* Scroll indicator, centred between the two control clusters. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex">
        <span className="flex flex-col items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-ink-300">
          <span className="relative h-10 w-px overflow-hidden bg-white/15">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-4 bg-brass-300 motion-safe:animate-[apc-scroll-hint_2.4s_ease-in-out_infinite]"
            />
          </span>
          <MoveDown className="size-3.5" aria-hidden="true" />
          <span>Scroll</span>
        </span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Controls                                                                   */
/* -------------------------------------------------------------------------- */

function HeroControls({
  slides,
  index,
  autoplaying,
  onPrev,
  onNext,
  onSelect,
}: {
  slides: { id: string; label: string }[];
  index: number;
  autoplaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/12 pt-5 sm:mt-12 sm:gap-6">
      {/* Indicators double as a progress read-out for the current slide. */}
      <div
        role="tablist"
        aria-label="Choose a slide"
        className="flex min-w-0 flex-1 items-end gap-2 sm:gap-3 lg:max-w-xl"
      >
        {slides.map((slide, i) => {
          const isActive = i === index;
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Slide ${i + 1} of ${slides.length}: ${slide.label}`}
              onClick={() => onSelect(i)}
              className="group min-w-0 flex-1 pb-1 pt-2 text-left"
            >
              <span
                className={cn(
                  "block truncate text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                  isActive
                    ? "text-white"
                    : "text-ink-300 group-hover:text-ink-100",
                )}
              >
                <span className="tnum text-brass-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ml-2 hidden sm:inline">{slide.label}</span>
              </span>
              <span className="mt-2 block h-0.5 w-full overflow-hidden rounded-full bg-white/20">
                <span
                  // Keyed on the slide index so the sweep restarts with it.
                  key={`${slide.id}-${index}`}
                  className={cn(
                    "block h-full origin-left rounded-full bg-brass-300",
                    isActive
                      ? "w-full animate-[apc-hero-progress_var(--hero-interval)_linear_forwards]"
                      : "w-0",
                  )}
                  // Pausing holds the sweep where it is rather than snapping it
                  // to full, so hovering reads as "waiting", not "finished".
                  style={
                    isActive
                      ? { animationPlayState: autoplaying ? "running" : "paused" }
                      : undefined
                  }
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <HeroArrow label="Previous slide" onClick={onPrev}>
          <ArrowLeft className="size-4" aria-hidden="true" />
        </HeroArrow>
        <HeroArrow label="Next slide" onClick={onNext}>
          <ArrowRight className="size-4" aria-hidden="true" />
        </HeroArrow>
      </div>
    </div>
  );
}

function HeroArrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="on-ink flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/15 active:translate-y-px"
    >
      {children}
    </button>
  );
}
