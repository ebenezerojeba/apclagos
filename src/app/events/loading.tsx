import { PageSkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the events calendar: header, then event cards three-up.
 */
export default function Loading() {
  return <PageSkeleton kind="event" count={6} columns="trio" />;
}
