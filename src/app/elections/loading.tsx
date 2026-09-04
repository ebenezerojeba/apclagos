import {
  ContentSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the election index: one wide card per cycle. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading elections">
      <PageHeaderSkeleton facts={0} />
      <div className="container-page py-16">
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-subtle bg-surface p-7"
            >
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="mt-4 h-9 w-3/4" />
              <ContentSkeleton lines={2} className="mt-3" />
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-subtle pt-5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
