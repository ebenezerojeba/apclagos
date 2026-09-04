import { PageSkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the document library.
 */
export default function Loading() {
  return <PageSkeleton kind="media" count={4} columns="duo" />;
}
