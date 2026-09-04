"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Global navigation progress bar.
 *
 * The App Router gives no "navigation started" event, so this listens for the
 * click itself: the bar appears on the same tick the viewer presses a link,
 * which is the whole point — a person who gets no acknowledgement clicks again.
 *
 * Completion is detected three ways, because no single one covers everything:
 *
 *   1. `usePathname()` changing — the ordinary case, and the most precise;
 *   2. `location.href` changing, polled on the trickle tick — catches
 *      navigations that only alter the query string (`/news` →
 *      `/news?category=…`), where the pathname never changes;
 *   3. a safety timeout — so a cancelled or failed navigation can never leave
 *      the bar stranded across the top of the page.
 *
 * The trickle writes `transform` and `opacity` straight to the node rather than
 * going through state: progress updates several times a second, and re-rendering
 * the tree for a 2px bar would be absurd. `scaleX` also keeps it off the layout
 * path entirely, so the bar cannot cause a reflow while a page is loading.
 */

/** How often the bar creeps forward while waiting. */
const TRICKLE_MS = 180;
/** Never reach the end on its own — arriving at 100% is what completion means. */
const CEILING = 0.92;
/** Longest a bar may run before it is force-completed. */
const SAFETY_MS = 8000;
/** Back/forward navigations resolve fast; give them a tighter leash. */
const POP_SAFETY_MS = 2500;

const HOLD_MS = 220;
const FADE_MS = 260;

export function RouteProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const mounted = useRef(false);

  const run = useRef({
    active: false,
    progress: 0,
    startHref: "",
    tick: 0,
    hide: 0,
    reset: 0,
    safety: 0,
  });

  const paint = useCallback((scale: number, opacity: number) => {
    const el = barRef.current;
    if (!el) return;
    el.style.transform = `scaleX(${scale})`;
    el.style.opacity = String(opacity);
  }, []);

  /** Snaps to a value with no transition — used when resetting to the start. */
  const snap = useCallback(
    (scale: number, opacity: number) => {
      const el = barRef.current;
      if (!el) return;
      el.style.transition = "none";
      paint(scale, opacity);
      // Force a reflow so the next write animates from here rather than
      // being coalesced into the same style recalculation.
      void el.offsetWidth;
      el.style.transition = "";
    },
    [paint],
  );

  const clearTimers = useCallback(() => {
    const s = run.current;
    window.clearInterval(s.tick);
    window.clearTimeout(s.hide);
    window.clearTimeout(s.reset);
    window.clearTimeout(s.safety);
    s.tick = s.hide = s.reset = s.safety = 0;
  }, []);

  const done = useCallback(() => {
    const s = run.current;
    if (!s.active) return;
    clearTimers();
    s.active = false;
    s.progress = 1;

    paint(1, 1);
    s.hide = window.setTimeout(() => paint(1, 0), HOLD_MS);
    s.reset = window.setTimeout(() => snap(0, 0), HOLD_MS + FADE_MS);
  }, [clearTimers, paint, snap]);

  const start = useCallback(
    (safetyMs = SAFETY_MS) => {
      const s = run.current;
      clearTimers();

      s.active = true;
      s.progress = 0.08;
      s.startHref = window.location.href;

      snap(0, 1);
      paint(s.progress, 1);

      s.tick = window.setInterval(() => {
        const cur = run.current;
        if (!cur.active) return;

        // A query-string-only navigation has committed.
        if (window.location.href !== cur.startHref) {
          done();
          return;
        }

        // Ease toward the ceiling: fast at first, then barely moving, so a slow
        // response still looks like progress rather than a stalled bar.
        const remaining = CEILING - cur.progress;
        cur.progress += Math.max(remaining * 0.12, 0.004);
        paint(Math.min(cur.progress, CEILING), 1);
      }, TRICKLE_MS);

      s.safety = window.setTimeout(done, safetyMs);
    },
    [clearTimers, done, paint, snap],
  );

  /* -- Navigation start ---------------------------------------------------- */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Anything that is not a plain left-click opens elsewhere or does nothing.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      // New tab, new window, or a file the browser will download instead.
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // External sites, mailto: and tel: all leave the app.
      if (url.origin !== window.location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      // Same page — either an in-page anchor or a click on the current link.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    };

    // Back/forward already changed the URL by the time this fires, so href
    // polling cannot detect completion; the pathname effect handles the usual
    // case and the shorter safety catches query-only history moves.
    const onPopState = () => start(POP_SAFETY_MS);

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  /* -- Navigation complete -------------------------------------------------- */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    done();
  }, [pathname, done]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-60 h-[3px]"
    >
      <div
        ref={barRef}
        className="route-progress h-full w-full origin-left bg-gradient-to-r from-crimson-700 via-crimson-500 to-brass-300"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />
    </div>
  );
}
