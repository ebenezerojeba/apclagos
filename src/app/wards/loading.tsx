import {
  LoadingRegion,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the ward register: local governments, each with its ward chips. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading wards">
      <PageHeaderSkeleton />
      <div className="container-page py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
