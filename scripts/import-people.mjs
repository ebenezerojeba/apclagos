/**
 * Bulk-imports people from a JSON file.
 *
 *   npm run import:people -- --file ./my-people.json
 *   npm run import:people -- --file ./my-people.json --dry-run
 *
 * Built for the volume this site actually needs: 20 local government chairmen,
 * 37 LCDA chairmen, 24 members of the House of Representatives, 40 of the
 * Assembly. Typing those into a form one at a time is a day's work and a
 * hundred chances to mistype a constituency slug; a spreadsheet exported to
 * JSON is minutes, and every reference is checked before anything is written.
 *
 * The file is either an array of records or `{ "people": [ ... ] }`. Each
 * record takes any field the Person model accepts, plus two conveniences:
 *
 *   "portraitFile"  a path to a local image, uploaded to Cloudinary
 *   "portraitAlt"   its alternative text (required if portraitFile is set)
 *
 * Example:
 *
 *   [
 *     {
 *       "kind": "chairman",
 *       "name": "A. N. Other",
 *       "position": "Chairman, Ikeja Local Government",
 *       "councilSlug": "ikeja",
 *       "councilType": "LGA",
 *       "councilRole": "Chairman",
 *       "status": "draft",
 *       "portraitFile": "./photos/ikeja-chairman.jpg",
 *       "portraitAlt": "Portrait of the Chairman of Ikeja Local Government",
 *       "biography": ["First paragraph.", "Second paragraph."]
 *     }
 *   ]
 *
 * Records are matched on `kind` + `slug`, so re-running the same file updates
 * rather than duplicates. Records default to `draft`: an import should never
 * put unreviewed text straight onto a public page.
 *
 * Everything is validated before anything is written. A file with one bad
 * constituency slug imports nothing, rather than leaving half the councils
 * populated and no clear record of which half.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { argv, env, exit } from "node:process";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const { Person, Media } = await import("../src/lib/server/models/index.ts");
const geography = await import("../src/data/geography.ts");
const { elections } = await import("../src/data/elections.ts");

/* -- Arguments -------------------------------------------------------------- */

function arg(name) {
  const index = argv.indexOf(`--${name}`);
  return index > -1 ? argv[index + 1] : undefined;
}
const dryRun = argv.includes("--dry-run");
const file = arg("file");

function fail(message) {
  console.error(`\n  ✖ ${message}\n`);
  exit(1);
}

if (!file) fail('Pass a file:  npm run import:people -- --file ./people.json');
if (!env.MONGODB_URI) fail("MONGODB_URI is not set. Run through the npm script.");

/* -- Reference data --------------------------------------------------------- */

/**
 * The slugs a record may point at.
 *
 * Checked here rather than left to the database because a wrong slug is not a
 * database error — it stores perfectly happily and simply detaches the person
 * from every page that lists their constituency. That is the failure mode this
 * whole script exists to avoid.
 */
const VALID = {
  senatorialDistrictSlug: new Set(geography.senatorialDistricts.map((d) => d.slug)),
  federalConstituencySlug: new Set(geography.federalConstituencies.map((c) => c.slug)),
  stateConstituencySlug: new Set(geography.stateConstituencies.map((c) => c.slug)),
  lgaSlug: new Set(geography.lgas.map((l) => l.slug)),
  lcdaSlug: new Set(geography.lcdas.map((l) => l.slug)),
  electionSlug: new Set(elections.map((e) => e.slug)),
};
const COUNCILS = new Set([
  ...geography.lgas.map((l) => l.slug),
  ...geography.lcdas.map((l) => l.slug),
]);

function toSlug(input) {
  return String(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* -- Load and validate ------------------------------------------------------ */

const path = resolvePath(file);
if (!existsSync(path)) fail(`No such file: ${path}`);

let parsed;
try {
  parsed = JSON.parse(await readFile(path, "utf8"));
} catch (error) {
  fail(`${path} is not valid JSON: ${error.message}`);
}

const records = Array.isArray(parsed) ? parsed : parsed?.people;
if (!Array.isArray(records)) {
  fail('The file must be a JSON array, or an object with a "people" array.');
}
if (records.length === 0) fail("The file contains no records.");

console.log(`\n  ${records.length} record${records.length === 1 ? "" : "s"} in ${file}`);

const problems = [];
const prepared = [];
const seen = new Set();

records.forEach((record, index) => {
  const where = `record ${index + 1}${record?.name ? ` (${record.name})` : ""}`;
  const note = (message) => problems.push(`${where}: ${message}`);

  if (!record?.name) return note("needs a name");
  if (!record.position) return note("needs a position");
  if (!record.kind) return note("needs a kind");

  const slug = record.slug ? toSlug(record.slug) : toSlug(record.name);
  if (!slug) return note("produces an empty slug");

  const key = `${record.kind}:${slug}`;
  if (seen.has(key)) return note(`duplicates an earlier ${record.kind} with slug "${slug}"`);
  seen.add(key);

  // Reference slugs must exist, whichever kind supplied them.
  for (const [field, allowed] of Object.entries(VALID)) {
    const value = record[field];
    if (value && !allowed.has(value)) {
      note(`${field} "${value}" is not a known slug`);
    }
  }
  if (record.councilSlug && !COUNCILS.has(record.councilSlug)) {
    note(`councilSlug "${record.councilSlug}" is not a known LGA or LCDA`);
  }

  if (record.portraitFile) {
    const portraitPath = resolvePath(record.portraitFile);
    if (!existsSync(portraitPath)) note(`portraitFile not found: ${portraitPath}`);
    if (!record.portraitAlt) note("portraitFile is set but portraitAlt is missing");
  }

  prepared.push({ record, slug, index });
});

if (problems.length > 0) {
  console.error(`\n  ✖ ${problems.length} problem${problems.length === 1 ? "" : "s"}; nothing was imported:\n`);
  for (const problem of problems) console.error(`     - ${problem}`);
  console.error("");
  exit(1);
}

console.log("  ✔ every record validates, and every reference slug exists");

if (dryRun) {
  console.log("\n  --dry-run: stopping before any write.\n");
  for (const { record, slug } of prepared) {
    console.log(`     ${record.kind.padEnd(26)} ${slug}`);
  }
  console.log("");
  exit(0);
}

/* -- Connect ---------------------------------------------------------------- */

try {
  await mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 15000,
    dbName: env.MONGODB_DB_NAME || "apclagos",
  });
} catch (error) {
  fail(
    `Could not reach MongoDB (${error.name}).\n` +
      "    If the message mentions querySrv or EBADRESP the fault is your local\n" +
      "    DNS: set DEV_DNS_SERVERS=8.8.8.8,8.8.4.4 in .env.local.",
  );
}

const canUpload = Boolean(
  env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
if (canUpload) {
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads one portrait, reusing a deterministic public id.
 *
 * Keying the asset on the person's slug with `overwrite` means re-running an
 * import replaces the photograph rather than accumulating a new copy of it on
 * every run.
 */
async function uploadPortrait(record, slug) {
  if (!record.portraitFile) return undefined;
  if (!canUpload) {
    console.log(`     ! ${slug}: Cloudinary is not configured, portrait skipped`);
    return undefined;
  }

  const asset = await cloudinary.uploader.upload(resolvePath(record.portraitFile), {
    folder: "apc-lagos/people",
    public_id: slug,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });

  await Media.findOneAndUpdate(
    { publicId: asset.public_id },
    {
      publicId: asset.public_id,
      url: asset.url,
      secureUrl: asset.secure_url,
      width: asset.width,
      height: asset.height,
      format: asset.format,
      bytes: asset.bytes,
      resourceType: "image",
      folder: "apc-lagos/people",
      alt: record.portraitAlt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    url: asset.url,
    secureUrl: asset.secure_url,
    publicId: asset.public_id,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    alt: record.portraitAlt,
    caption: record.portraitCaption,
    credit: record.portraitCredit,
    focal: record.portraitFocal ?? "center",
  };
}

/* -- Write ------------------------------------------------------------------ */

console.log("");
let created = 0;
let updated = 0;
const failures = [];

/**
 * The keys that describe the portrait rather than the person.
 *
 * They are consumed by `uploadPortrait` and must not reach `Object.assign`,
 * where they would be written to the document as stray top-level fields the
 * schema knows nothing about.
 */
const PORTRAIT_KEYS = [
  "portraitFile",
  "portraitAlt",
  "portraitCaption",
  "portraitCredit",
  "portraitFocal",
];

for (const { record, slug } of prepared) {
  const fields = Object.fromEntries(
    Object.entries(record).filter(([key]) => !PORTRAIT_KEYS.includes(key)),
  );

  try {
    const portrait = await uploadPortrait(record, slug);

    const existing = await Person.findOne({ kind: record.kind, slug });
    const target = existing ?? new Person({ kind: record.kind, slug });

    Object.assign(target, fields, {
      slug,
      // Imported records stay unpublished unless the file says otherwise, so a
      // spreadsheet cannot put unreviewed text on a public page by accident.
      status: record.status ?? "draft",
    });
    if (portrait) target.set("portrait", portrait);

    await target.save();
    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
    console.log(`     ${existing ? "updated" : "created"}  ${record.kind.padEnd(26)} ${slug}`);
  } catch (error) {
    const detail =
      error?.name === "ValidationError"
        ? Object.values(error.errors ?? {})
            .map((issue) => issue.message)
            .join("; ")
        : error?.message?.split(",")[0] ?? String(error);
    failures.push(`${record.name}: ${detail}`);
    console.log(`     FAILED   ${record.kind.padEnd(26)} ${slug}`);
  }
}

console.log(`\n  ${created} created, ${updated} updated, ${failures.length} failed`);
if (failures.length > 0) {
  console.log("\n  Failures:");
  for (const failure of failures) console.log(`     - ${failure}`);
}
console.log(
  "\n  Imported records are drafts unless the file set a status. Review them\n" +
    "  at /admin/people, then set each to Published.\n",
);

await mongoose.disconnect();
exit(failures.length > 0 ? 1 : 0);
