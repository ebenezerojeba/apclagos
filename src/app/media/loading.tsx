import { DirectorySkeleton } from "@/components/ui/skeletons";

/**
 * Mirrors the video library.
 */
export default function Loading() {
  return <DirectorySkeleton kind="media" count={8} selects={0} />;
}
