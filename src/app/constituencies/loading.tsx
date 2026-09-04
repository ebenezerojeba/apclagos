import {
  LoadingRegion,
  PageHeaderSkeleton,
  SectionHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors the constituencies reference: three stacked bands of listings. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading constituencies">
      <PageHeaderSkeleton />
      <div className="container-page space-y-16 py-16">
        {[3, 6, 8].map((count, band) => (
          <div key={band}>
            <SectionHeaderSkeleton />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border-subtle bg-surface p-4"
                >
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-2 h-3 w-40" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
