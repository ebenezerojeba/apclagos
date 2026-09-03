import { PageSkeleton } from "@/components/ui/states";

/** Route-level loading state, shown while a page's data resolves. */
export default function Loading() {
  return <PageSkeleton />;
}
