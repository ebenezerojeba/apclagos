import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the candidate directory, which carries five constituency selects.
 */
export default function Loading() {
  return <DirectorySkeleton kind="portrait" count={8} selects={3} />;
}
