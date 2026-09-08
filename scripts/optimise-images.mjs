/**
 * Re-encodes the images committed under `public/images`.
 *
 *   npm run images:optimise            # report only
 *   npm run images:optimise -- --write # rewrite the files
 *
 * Next.js resizes and re-encodes on delivery, so an oversized source never
 * reaches a visitor directly. It still costs, in two places worth caring about:
 * every cache miss pays to decode the original before it can produce a variant,
 * and on Vercel that transform sits on the critical path of the largest
 * contentful paint the first time any given size is requested. The hero
 * photographs were 2.5 MB of source between them, which is a slow first paint
 * for pixels nobody ever sees at that resolution.
 *
 * Quality 76 with mozjpeg, progressive. These are photographs shown behind a
 * dark overlay at hero scale; the difference from the originals is not visible,
 * and the difference in bytes is about eighty per cent.
 *
 * `sharp` is not a dependency of this project — Next.js installs it to do its
 * own image optimisation, which means it is reliably present in any tree where
 * `next build` can run. That is the only reason this script does not add one.
 *
 * The originals are committed, so `git checkout -- public/images` undoes this.
 */

import sharp from "sharp";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { argv } from "node:process";

const ROOT = "public/images";
/** Beyond this width nothing on the site can display the extra pixels. */
const MAX_WIDTH = 2400;
const JPEG = { quality: 76, mozjpeg: true, progressive: true };
const PNG = { quality: 82, compressionLevel: 9, palette: true };

const write = argv.includes("--write");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jpe?g|png)$/i.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
let before = 0;
let after = 0;
let rewritten = 0;

for (const file of files) {
  const original = statSync(file).size;
  const isPng = extname(file).toLowerCase() === ".png";

  // Read into memory before decoding. Handing sharp a path keeps the file
  // open, and on Windows writing back to that same path then fails with
  // EUNKNOWN — the source has to be released before it can be replaced.
  const source = readFileSync(file);
  const pipeline = sharp(source).resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const buffer = await (isPng ? pipeline.png(PNG) : pipeline.jpeg(JPEG)).toBuffer();

  before += original;

  // Never make a file bigger. A small, already-optimised asset (the logo, an
  // icon) is left exactly as it is.
  if (buffer.length >= original) {
    after += original;
    console.log(`  keep    ${file.padEnd(46)} ${(original / 1024).toFixed(0)} KB (already optimal)`);
    continue;
  }

  after += buffer.length;
  const saved = (100 - (buffer.length / original) * 100).toFixed(0);
  console.log(
    `  ${write ? "write " : "would "} ${file.padEnd(46)} ` +
      `${(original / 1024).toFixed(0).padStart(4)} KB -> ${(buffer.length / 1024).toFixed(0).padStart(4)} KB  (-${saved}%)`,
  );

  if (write) {
    writeFileSync(file, buffer);
    rewritten += 1;
  }
}

console.log(
  `\n  ${files.length} image(s): ${(before / 1024 / 1024).toFixed(2)} MB -> ` +
    `${(after / 1024 / 1024).toFixed(2)} MB  (-${(100 - (after / before) * 100).toFixed(0)}%)`,
);
if (!write) console.log("  Nothing written. Re-run with --write to apply.\n");
else console.log(`  ${rewritten} file(s) rewritten.\n`);
