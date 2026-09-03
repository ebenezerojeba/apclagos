"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useFocusTrap, useLockBodyScroll } from "@/hooks";

/**
 * Accessible dialog: rendered into a portal at the end of `<body>`, labelled,
 * focus-trapped, Escape-closable, and scroll-locking. Used by the global search
 * palette, the lightbox and the mobile navigation drawer.
 */
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  label,
  className,
  panelClassName,
  align = "center",
  backdropClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the element that titles the dialog. */
  labelledBy?: string;
  /** Used when there is no visible title. */
  label?: string;
  className?: string;
  panelClassName?: string;
  align?: "center" | "top" | "right" | "full";
  backdropClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => setMounted(true), []);
  useLockBodyScroll(open);
  useFocusTrap(panelRef, open, onClose);

  if (!mounted) return null;

  const positions = {
    center: "items-center justify-center p-4 sm:p-6",
    top: "items-start justify-center p-4 pt-[8vh] sm:p-6 sm:pt-[10vh]",
    right: "items-stretch justify-end",
    full: "items-stretch justify-center",
  } as const;

  const panelMotion = reduced
    ? {}
    : align === "right"
      ? {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {
          initial: { opacity: 0, y: 16, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 8, scale: 0.99 },
          transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
        };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn("fixed inset-0 z-100 flex", positions[align], className)}
        >
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            initial={reduced ? undefined : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={cn(
              "absolute inset-0 bg-ink-950/70 backdrop-blur-[3px]",
              backdropClassName,
            )}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : label}
            {...panelMotion}
            className={cn("relative z-10 flex w-full flex-col", panelClassName)}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ModalCloseButton({
  onClose,
  className,
  tone = "light",
  label = "Close",
}: {
  onClose: () => void;
  className?: string;
  tone?: "light" | "dark";
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full transition-colors",
        tone === "dark"
          ? "on-ink bg-white/10 text-white hover:bg-white/20"
          : "bg-paper-200 text-fg-muted hover:bg-paper-300 hover:text-fg",
        className,
      )}
    >
      <X className="size-5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
