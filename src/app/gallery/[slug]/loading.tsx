import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeletons";

/**
 * Mirrors an album page: the masonry grid of photographs.
 *
 * The heights vary deliberately. The real grid uses CSS columns and each
 * photograph keeps its own ratio, so a column of identical boxes would collapse
 * into a different shape the moment the images arrived.
 */
const TILE_HEIGHTS = [
  "h-56",
  "h-72",
  "h-64",
  "h-80",
  "h-56",
  "h-68",
  "h-76",
  "h-60",
  "h-72",
];

export default function Loading() {
  return (
    <LoadingRegion label="Loading album">
      <PageHeaderSkeleton />
      <div className="container-page py-16">
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>div]:mb-4">
          {TILE_HEIGHTS.map((height, i) => (
            <div key={i} className="break-inside-avoid">
              <Skeleton className={`w-full rounded-xl ${height}`} />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
