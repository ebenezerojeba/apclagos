import {
  ContentSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the About page: institutional prose beside the at-a-glance card. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading about page">
      <PageHeaderSkeleton />
      <div className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div className="max-w-3xl space-y-6">
            <ContentSkeleton lines={5} />
            <ContentSkeleton lines={4} />
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface p-6">
            <Skeleton className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-4 py-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="container-page pb-16">
        <SectionHeaderSkeleton />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-subtle bg-surface p-7"
            >
              <Skeleton className="h-6 w-28" />
              <ContentSkeleton lines={3} className="mt-4" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
