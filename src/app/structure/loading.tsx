import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the structure explorer: the state panel over three tier columns. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading structure explorer">
      <PageHeaderSkeleton />
      <div className="container-page py-16">
        <SectionHeaderSkeleton className="mb-10" />
        <div className="overflow-hidden rounded-2xl panel-ink p-6 lg:p-7">
          <Skeleton className="h-3 w-40 bg-white/10" />
          <Skeleton className="mt-3 h-8 w-96 max-w-full bg-white/12" />
          <Skeleton className="mt-2 h-3 w-72 max-w-full bg-white/8" />
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full bg-white/10" />
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-subtle bg-surface p-5"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-6 w-40" />
              <div className="mt-5 space-y-2.5">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-9 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
