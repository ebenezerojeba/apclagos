import "server-only";

import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary — the media store.
 *
 * The upload flow is deliberately *signed direct upload*, not proxy upload:
 *
 *   1. the admin picks a file;
 *   2. the browser asks this server to sign a set of upload parameters;
 *   3. the browser POSTs the file straight to Cloudinary with that signature;
 *   4. Cloudinary returns the asset;
 *   5. the app saves the reference in MongoDB.
 *
 * The file never passes through Vercel. That matters for more than elegance:
 * a serverless function has a hard request-body limit (4.5 MB on Vercel) and a
 * short execution ceiling, so proxying a 12 MB press photograph through it
 * would fail outright. Signing is also what keeps `CLOUDINARY_API_SECRET`
 * server-side — the browser receives a signature valid for one upload with one
 * specific set of parameters, never the key itself.
 *
 * Only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is exposed to the browser, which is
 * public by design: it appears in every delivery URL.
 */

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export class CloudinaryNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(
      `Cloudinary is not configured. Missing: ${missing.join(", ")}. ` +
        "Set these in .env.local locally and in the Vercel project settings.",
    );
    this.name = "CloudinaryNotConfiguredError";
  }
}

/** Which variables are absent. Never returns any value, only names. */
export function cloudinaryMissingVars(): string[] {
  const missing: string[] = [];
  if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  if (!apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");
  return missing;
}

export function isCloudinaryConfigured(): boolean {
  return cloudinaryMissingVars().length === 0;
}

function configured() {
  const missing = cloudinaryMissingVars();
  if (missing.length > 0) throw new CloudinaryNotConfiguredError(missing);

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

/** Where uploads land, so the Cloudinary media library stays navigable. */
export const UPLOAD_FOLDERS = {
  people: "apc-lagos/people",
  news: "apc-lagos/news",
  events: "apc-lagos/events",
  pages: "apc-lagos/pages",
  gallery: "apc-lagos/gallery",
  logos: "apc-lagos/logos",
  general: "apc-lagos/general",
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

/**
 * Signs one upload.
 *
 * The signature covers exactly the parameters the browser is allowed to send.
 * Anything the client adds beyond them invalidates it — so a signature issued
 * for `apc-lagos/people` cannot be replayed to write somewhere else, and the
 * upload cannot be re-pointed at another account.
 */
export function createUploadSignature(folder: UploadFolder): UploadSignature {
  const client = configured();
  const timestamp = Math.round(Date.now() / 1000);
  const targetFolder = UPLOAD_FOLDERS[folder] ?? UPLOAD_FOLDERS.general;

  const params = {
    timestamp,
    folder: targetFolder,
    // Cloudinary derives the public id from the filename; this keeps names
    // predictable and avoids collisions between two "portrait.jpg" uploads.
    use_filename: "true",
    unique_filename: "true",
    overwrite: "false",
  };

  const signature = client.utils.api_sign_request(params, apiSecret as string);

  return {
    signature,
    timestamp,
    apiKey: apiKey as string,
    cloudName: cloudName as string,
    folder: targetFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

/**
 * What Cloudinary returns after a successful direct upload. Narrowed to the
 * fields the application stores — the raw response carries far more.
 */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
}

/**
 * Verifies an upload actually exists before it is saved.
 *
 * The browser reports what Cloudinary told it, but the browser is not
 * trustworthy: without this check an administrator's session could be used to
 * write an arbitrary attacker-chosen URL into the database. Asking Cloudinary
 * directly means only assets that genuinely exist in this account get stored.
 */
export async function verifyUpload(
  publicId: string,
): Promise<CloudinaryUploadResult | null> {
  const client = configured();
  try {
    const asset = await client.api.resource(publicId, { resource_type: "image" });
    return {
      public_id: asset.public_id,
      secure_url: asset.secure_url,
      url: asset.url,
      width: asset.width,
      height: asset.height,
      format: asset.format,
      bytes: asset.bytes,
      resource_type: asset.resource_type,
    };
  } catch {
    return null;
  }
}

/**
 * Removes an asset.
 *
 * Called when an image is replaced or its owning record is deleted, so the
 * Cloudinary account does not accumulate orphans. Failure is logged rather than
 * thrown: a delete that cannot reach Cloudinary must not block the database
 * write it accompanies, or the record and the asset drift out of step.
 */
export async function destroyAsset(publicId: string): Promise<boolean> {
  try {
    const client = configured();
    const result = await client.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[cloudinary] destroy failed for ${publicId}: ${name}`);
    return false;
  }
}

/**
 * Builds a delivery URL with transformations applied.
 *
 * Cloudinary resizes and re-encodes on its own CDN, so the browser is never
 * sent a 6 MB original when it needs an 800px card image. `f_auto` and `q_auto`
 * let Cloudinary pick AVIF or WebP per browser.
 */
export function cloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {},
): string {
  if (!cloudName) return "";
  const parts = ["f_auto", "q_auto"];
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  parts.push(`c_${options.crop ?? "fill"}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${parts.join(",")}/${publicId}`;
}
