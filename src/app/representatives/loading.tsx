import { PageSkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the chamber overview: three chamber cards, then published profiles.
 */
export default function Loading() {
  return <PageSkeleton kind="portrait" count={6} columns="trio" />;
}
