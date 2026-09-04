"use client";

import { useLinkStatus } from "next/link";

/**
 * Per-control navigation feedback.
 *
 * The global bar at the top of the viewport says *something* is loading; this
 * says *this control* is the thing loading. That distinction is what stops the
 * repeat-click: a button that visibly acknowledges the press does not get
 * pressed again.
 *
 * Rendered inside a `next/link`, so `useLinkStatus` can read that link's own
 * pending state. It draws a sweeping rule along the bottom inside edge of the
 * control rather than swapping in a spinner, because a spinner would resize the
 * label and shift the layout at the exact moment the viewer is looking at it.
 *
 * `bg-current` inherits the control's text colour, so this works on every
 * button variant without knowing anything about them.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 bottom-1.5 h-0.5 overflow-hidden rounded-full bg-current/20"
    >
      <span className="link-pending-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-current" />
    </span>
  );
}
