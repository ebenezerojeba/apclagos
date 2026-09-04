import { PageSkeleton } from "@/components/ui/skeletons";

/** Mirrors an election hub: the cycle masthead, then candidates by office. */
export default function Loading() {
  return <PageSkeleton kind="portrait" count={8} />;
}
