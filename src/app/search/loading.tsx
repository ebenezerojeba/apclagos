import {
  LoadingRegion,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the search results page: the query field, then grouped result rows. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading search results">
      <PageHeaderSkeleton facts={0} />
      <div className="container-page space-y-12 py-16">
        {Array.from({ length: 3 }).map((_, group) => (
          <div key={group}>
            <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="mt-2">
              {Array.from({ length: 4 }).map((_, row) => (
                <div key={row} className="space-y-2 px-3 py-4">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
