import {
  ContentSkeleton,
  ImageSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeletons";

/** Mirrors a video page: the player, its description and the detail rail. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading video">
      <PageHeaderSkeleton facts={0} />
      <div className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-16">
          <div>
            <ImageSkeleton aspect="aspect-video" className="rounded-2xl" />
            <ContentSkeleton lines={3} className="mt-8 max-w-3xl" />
          </div>
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
