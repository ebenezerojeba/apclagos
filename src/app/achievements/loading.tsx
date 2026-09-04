import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the achievements browser: search, year select, sector chips, cards.
 */
export default function Loading() {
  return <DirectorySkeleton kind="media" count={6} selects={1} />;
}
