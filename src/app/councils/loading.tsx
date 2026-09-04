import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the 57-council directory: filters, count, then council cards.
 */
export default function Loading() {
  return <DirectorySkeleton kind="council" count={8} selects={1} />;
}
