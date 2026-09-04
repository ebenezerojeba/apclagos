import { DirectorySkeleton } from "@/components/ui/skeletons";

/** Mirrors a chamber listing: constituency filters over member cards. */
export default function Loading() {
  return <DirectorySkeleton kind="portrait" count={8} selects={1} />;
}
