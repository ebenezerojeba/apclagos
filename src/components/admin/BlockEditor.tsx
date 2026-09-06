"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ImageField, type ImageValue } from "@/components/admin/ImageField";

/**
 * Builds the body of an article, event or page.
 *
 * A block list rather than a rich-text editor, and that is the important
 * decision. A WYSIWYG editor stores HTML, which means either trusting an
 * editor's markup on a public page — the stored-XSS route — or sanitising it on
 * every render. A closed set of typed blocks cannot express anything the
 * renderer does not already know how to draw, so the whole class of problem
 * does not arise. It also survives a redesign: blocks are meaning, not markup.
 *
 * The value is serialised into one hidden input. The server re-validates it,
 * because a hidden field is exactly as forgeable as a visible one.
 */

type BlockType = "paragraph" | "heading" | "list" | "quote" | "image" | "video";

export interface Block {
  type: BlockType;
  text?: string;
  level?: 2 | 3;
  ordered?: boolean;
  items?: string[];
  attribution?: string;
  image?: ImageValue;
  videoProvider?: "youtube" | "vimeo" | "file";
  videoRef?: string;
  title?: string;
}

const LABELS: Record<BlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  list: "List",
  quote: "Quotation",
  image: "Image",
  video: "Video",
};

const CONTROL =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg " +
  "focus:outline-none focus-visible:border-ink-500 focus-visible:ring-2 focus-visible:ring-ink-200";

export function BlockEditor({
  name,
  folder,
  initial,
}: {
  name: string;
  folder: string;
  initial?: Block[];
}) {
  const [blocks, setBlocks] = useState<Block[]>(initial ?? []);

  function add(type: BlockType) {
    const seed: Block =
      type === "heading"
        ? { type, level: 2, text: "" }
        : type === "list"
          ? { type, ordered: false, items: [] }
          : type === "video"
            ? { type, videoProvider: "youtube", videoRef: "" }
            : { type, text: "" };
    setBlocks((current) => [...current, seed]);
  }

  function patch(index: number, changes: Partial<Block>) {
    setBlocks((current) =>
      current.map((block, position) =>
        position === index ? { ...block, ...changes } : block,
      ),
    );
  }

  function remove(index: number) {
    setBlocks((current) => current.filter((_, position) => position !== index));
  }

  function move(index: number, delta: number) {
    setBlocks((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <fieldset className="rounded-xl border border-border bg-paper-100/40 p-4">
      <legend className="px-1.5 text-sm font-medium text-fg">Body</legend>

      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-fg-muted">
          No content yet. Add a block below.
        </p>
      ) : (
        <ol className="space-y-3">
          {blocks.map((block, index) => (
            // Index as key is correct here: blocks have no identity of their
            // own, and reordering deliberately moves the DOM node with the
            // value it holds.
            <li key={index} className="rounded-lg border border-border bg-surface p-3.5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-fg-subtle">
                  {index + 1}. {LABELS[block.type]}
                </span>
                <span className="flex items-center gap-1">
                  <IconButton
                    label={`Move ${LABELS[block.type]} up`}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="size-3.5" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`Move ${LABELS[block.type]} down`}
                    onClick={() => move(index, 1)}
                    disabled={index === blocks.length - 1}
                  >
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`Remove ${LABELS[block.type]}`}
                    onClick={() => remove(index)}
                    destructive
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </IconButton>
                </span>
              </div>

              {block.type === "paragraph" ? (
                <textarea
                  rows={4}
                  value={block.text ?? ""}
                  onChange={(event) => patch(index, { text: event.target.value })}
                  placeholder="Write the paragraph…"
                  className={`${CONTROL} resize-y leading-relaxed`}
                  aria-label="Paragraph text"
                />
              ) : null}

              {block.type === "heading" ? (
                <div className="flex flex-wrap gap-2">
                  <select
                    value={String(block.level ?? 2)}
                    onChange={(event) =>
                      patch(index, { level: Number(event.target.value) as 2 | 3 })
                    }
                    aria-label="Heading level"
                    className={`${CONTROL} w-auto`}
                  >
                    <option value="2" className="bg-surface text-fg">Section heading</option>
                    <option value="3" className="bg-surface text-fg">Sub-heading</option>
                  </select>
                  <input
                    value={block.text ?? ""}
                    onChange={(event) => patch(index, { text: event.target.value })}
                    placeholder="Heading text"
                    aria-label="Heading text"
                    className={`${CONTROL} min-w-0 flex-1`}
                  />
                </div>
              ) : null}

              {block.type === "list" ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-fg-muted">
                    <input
                      type="checkbox"
                      checked={Boolean(block.ordered)}
                      onChange={(event) => patch(index, { ordered: event.target.checked })}
                      className="size-4 rounded border-border accent-ink-900"
                    />
                    Numbered
                  </label>
                  <textarea
                    rows={4}
                    value={(block.items ?? []).join("\n")}
                    onChange={(event) =>
                      patch(index, {
                        items: event.target.value
                          .split(/\r?\n/)
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="One item per line"
                    aria-label="List items, one per line"
                    className={`${CONTROL} resize-y`}
                  />
                </div>
              ) : null}

              {block.type === "quote" ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={block.text ?? ""}
                    onChange={(event) => patch(index, { text: event.target.value })}
                    placeholder="The quotation…"
                    aria-label="Quotation"
                    className={`${CONTROL} resize-y`}
                  />
                  <input
                    value={block.attribution ?? ""}
                    onChange={(event) => patch(index, { attribution: event.target.value })}
                    placeholder="Who said it"
                    aria-label="Attribution"
                    className={CONTROL}
                  />
                </div>
              ) : null}

              {block.type === "image" ? (
                <InlineImage
                  folder={folder}
                  value={block.image}
                  onChange={(image) => patch(index, { image })}
                />
              ) : null}

              {block.type === "video" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={block.videoProvider ?? "youtube"}
                      onChange={(event) =>
                        patch(index, {
                          videoProvider: event.target.value as Block["videoProvider"],
                        })
                      }
                      aria-label="Video provider"
                      className={`${CONTROL} w-auto`}
                    >
                      <option value="youtube" className="bg-surface text-fg">YouTube</option>
                      <option value="vimeo" className="bg-surface text-fg">Vimeo</option>
                      <option value="file" className="bg-surface text-fg">Direct file</option>
                    </select>
                    <input
                      value={block.videoRef ?? ""}
                      onChange={(event) => patch(index, { videoRef: event.target.value })}
                      placeholder="Video ID or URL"
                      aria-label="Video reference"
                      className={`${CONTROL} min-w-0 flex-1`}
                    />
                  </div>
                  <input
                    value={block.title ?? ""}
                    onChange={(event) => patch(index, { title: event.target.value })}
                    placeholder="Title, used as the frame's accessible name"
                    aria-label="Video title"
                    className={CONTROL}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(LABELS) as BlockType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {LABELS[type]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * An image inside a block.
 *
 * Reuses `ImageField` for the upload so there is one implementation of the
 * signed direct-to-Cloudinary flow rather than two, and takes the value back
 * through its `onChange` - the block array is the owner here, not the form.
 */
function InlineImage({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value?: ImageValue;
  onChange: (image: ImageValue | undefined) => void;
}) {
  return (
    <ImageField
      name="block-image"
      label="Image"
      folder={folder}
      initial={value ?? null}
      onChange={(next) => onChange(next ?? undefined)}
    />
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "grid size-7 place-items-center rounded-md border border-border text-fg-muted transition-colors",
        "hover:border-border-strong hover:text-fg",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-600",
        "disabled:cursor-not-allowed disabled:opacity-40",
        destructive ? "hover:border-crimson-300 hover:text-crimson-700" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
