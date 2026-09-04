import {
  GridSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors an LCDA page: officials, then the three structure panels. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading council">
      <PageHeaderSkeleton />
      <div className="container-page py-16">
        <SectionHeaderSkeleton />
        <GridSkeleton className="mt-10" count={4} kind="portrait" />
      </div>
      <div className="container-page pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-subtle bg-surface p-6"
            >
              <Skeleton className="h-6 w-40" />
              <div className="mt-5 space-y-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
