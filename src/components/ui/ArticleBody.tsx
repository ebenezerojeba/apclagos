import { SmartImage, SIZES } from "@/components/ui/Media";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { cn } from "@/lib/utils";
import type { ArticleBlock } from "@/types/content";

/**
 * Renders the structured article body.
 *
 * The block model is deliberately closed: only the node types declared in
 * `ArticleBlock` can appear, and each is rendered as real markup. No raw HTML
 * from the data layer is ever injected into the page, which removes the whole
 * class of stored-XSS risks that come with a rich-text field.
 */
export function ArticleBody({
  blocks,
  className,
}: {
  blocks: ArticleBlock[];
  className?: string;
}) {
  return (
    <div className={cn("prose-institutional", className)}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return <p key={index}>{block.text}</p>;

          case "heading":
            return block.level === 2 ? (
              <h2 key={index}>{block.text}</h2>
            ) : (
              <h3 key={index}>{block.text}</h3>
            );

          case "list":
            return block.ordered ? (
              <ol key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );

          case "quote":
            return (
              <figure key={index} className="my-10">
                <blockquote className="border-l-2 border-brass-400 pl-6">
                  <p className="font-display text-xl leading-relaxed text-fg sm:text-2xl">
                    &ldquo;{block.text}&rdquo;
                  </p>
                </blockquote>
                {block.attribution ? (
                  <figcaption className="mt-3 pl-6 text-sm font-medium text-fg-subtle">
                    — {block.attribution}
                  </figcaption>
                ) : null}
              </figure>
            );

          case "image":
            return (
              <figure key={index} className="my-10">
                <SmartImage
                  image={block.image}
                  aspect="news"
                  sizes={SIZES.feature}
                  className="rounded-2xl"
                />
                {block.image.caption || block.image.credit ? (
                  <figcaption className="mt-3 text-sm text-fg-subtle">
                    {block.image.caption}
                    {block.image.credit ? (
                      <span className="mt-0.5 block text-xs">
                        Photograph: {block.image.credit}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
            );

          case "video":
            return (
              <figure key={index} className="my-10">
                <VideoPlayer
                  embed={block.video}
                  title={block.title ?? "Embedded video"}
                />
                {block.title ? (
                  <figcaption className="mt-3 text-sm text-fg-subtle">
                    {block.title}
                  </figcaption>
                ) : null}
              </figure>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
