import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the LCDA directory.
 */
export default function Loading() {
  return <DirectorySkeleton kind="council" count={8} selects={1} />;
}
