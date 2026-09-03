"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks";
import type { Milestone } from "@/types/content";

/**
 * The party history timeline.
 *
 * This is the one place GSAP earns its place over Framer Motion: the brass rail
 * is *scrubbed* — its fill is tied continuously to the section's scroll
 * progress, forwards and backwards — and each node lights as the fill reaches
 * it. ScrollTrigger does that in one declaration; reproducing it with per-element
 * viewport triggers would mean a dozen independent animations that disagree with
 * each other when the visitor scrolls back up.
 *
 * Everything animated here is transform and opacity only, so the scrub never
 * triggers layout. Under `prefers-reduced-motion` no trigger is created at all:
 * the rail renders fully drawn and every node lit.
 */
export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  const rootRef = useRef<HTMLOListElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const rail = railRef.current;
    if (!root || !rail) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    // GSAP is imported after hydration rather than at module scope: the
    // milestones themselves are server-rendered (so they are indexable and
    // readable without JavaScript), and the ~48kB animation engine stays off
    // the critical path for a page that is mostly prose.
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      // `gsap.context` scopes every selector and reverts the whole lot on
      // cleanup, which matters under React strict mode's double-invoked effects.
      ctx = gsap.context(() => {
        gsap.set(rail, { scaleY: 0, transformOrigin: "top center" });

        const nodes = gsap.utils.toArray<HTMLElement>("[data-milestone-node]");
        const bodies = gsap.utils.toArray<HTMLElement>("[data-milestone-body]");
        gsap.set(nodes, { scale: 0.7, opacity: 0.35 });
        gsap.set(bodies, { opacity: 0.45, y: 10 });

        // The rail fill is tied continuously to the section's scroll progress.
        gsap.to(rail, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 72%",
            end: "bottom 65%",
            scrub: 0.6,
          },
        });

        // Each node lights as the fill reaches it, and dims again on the way back.
        nodes.forEach((node, index) => {
          const body = bodies[index];
          gsap
            .timeline({
              scrollTrigger: {
                trigger: node,
                start: "top 78%",
                end: "top 55%",
                scrub: 0.6,
              },
            })
            .to(node, { scale: 1, opacity: 1, ease: "power2.out" }, 0)
            .to(body, { opacity: 1, y: 0, ease: "power2.out" }, 0);
        });
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <ol ref={rootRef} className="relative mt-14 pl-8 sm:pl-10">
      {/* The rail: a static track with a brass fill scrubbed over it. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-px bg-white/12"
      >
        <span
          ref={railRef}
          className="absolute inset-0 block bg-gradient-to-b from-brass-300 via-brass-400 to-brass-400/30"
        />
      </span>

      {milestones.map((milestone) => (
        <li key={milestone.id} className="relative pb-12 last:pb-0">
          <span
            data-milestone-node
            aria-hidden="true"
            className="absolute -left-[2.3rem] top-1.5 flex size-5 items-center justify-center rounded-full border border-brass-400/60 bg-ink-950 sm:-left-[2.8rem]"
          >
            <span className="size-2 rounded-full bg-brass-300" />
          </span>
          <div data-milestone-body>
            <p className="tnum font-display text-2xl leading-none text-brass-300">
              {milestone.year}
            </p>
            <h3 className="mt-3 font-display text-xl text-white sm:text-2xl">
              {milestone.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-200 sm:text-base">
              {milestone.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
