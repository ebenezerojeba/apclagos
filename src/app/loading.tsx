import { PageSkeleton } from "@/components/ui/skeletons";

/**
 * The default route skeleton.
 *
 * Segments with a distinct shape ship their own `loading.tsx`; this catches
 * everything else with the common header-plus-grid composition.
 */
export default function Loading() {
  return <PageSkeleton />;
}
