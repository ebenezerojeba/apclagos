import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the leadership directory: chip filters over portrait cards.
 */
export default function Loading() {
  return <DirectorySkeleton kind="portrait" count={8} selects={0} />;
}
