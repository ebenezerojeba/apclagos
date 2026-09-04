import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the photo gallery: search, category chips, album cards.
 */
export default function Loading() {
  return <DirectorySkeleton kind="media" count={8} selects={0} />;
}
