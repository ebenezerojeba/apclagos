import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Split an array into fixed-size chunks (used by pagination and grids). */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Stable alphabetical sort that honours an optional manual `order` weight. */
export function byOrderThenName<
  T extends { order?: number; name?: string; title?: string },
>(a: T, b: T): number {
  const ao = a.order ?? Number.MAX_SAFE_INTEGER;
  const bo = b.order ?? Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  return (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? "");
}

/** Unique values, preserving first-seen order. */
export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** Group records by a derived key. */
export function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

/** Clamp a number into a range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Escape user-supplied text before it is placed into a regular expression.
 * Prevents a search box from becoming a ReDoS or injection vector.
 */
export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
