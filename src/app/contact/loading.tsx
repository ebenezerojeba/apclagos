import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the contact page: the enquiry form beside the secretariat panels. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading contact page">
      <PageHeaderSkeleton facts={0} />
      <div className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div>
            <SectionHeaderSkeleton className="mb-8" />
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1.5 h-11 w-full rounded-xl" />
                  </div>
                ))}
              </div>
              <div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-1.5 h-36 w-full rounded-xl" />
              </div>
              <Skeleton className="h-13 w-40 rounded-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-border-subtle bg-surface p-6">
              <Skeleton className="h-6 w-32" />
              <div className="mt-5 space-y-3.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
              <Skeleton className="m-6 h-6 w-32" />
              <Skeleton className="h-72 w-full rounded-none" />
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
