/**
 * Signed, direct-to-Cloudinary upload — the one implementation every admin
 * image field uses.
 *
 * The file never passes through this application. The browser asks the server
 * to sign one set of upload parameters, POSTs the file straight to Cloudinary
 * with that signature, and only the returned metadata comes back. That is not
 * an optimisation: a Vercel function caps request bodies at 4.5 MB, and press
 * photography routinely exceeds it, so proxying would fail on exactly the files
 * this site most needs.
 *
 * Returns a result rather than throwing, because every caller turns a failure
 * into a message beside the file that failed — and a gallery uploading twenty
 * photographs must keep going when one of them is rejected.
 */

export interface UploadedImage {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export type UploadResult =
  | { ok: true; image: UploadedImage }
  | { ok: false; error: string };

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Checked before any network request, so a wrong file fails instantly. */
export function checkImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG, WebP or AVIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return (
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB — ` +
      "export it at a smaller size and try again."
    );
  }
  return null;
}

export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  const problem = checkImageFile(file);
  if (problem) return { ok: false, error: problem };

  try {
    const signatureResponse = await fetch(
      `/api/admin/upload?folder=${encodeURIComponent(folder)}`,
    );
    if (!signatureResponse.ok) {
      const detail = await signatureResponse.json().catch(() => ({}));
      return { ok: false, error: detail.error ?? "Could not start the upload. Try again." };
    }
    const signed = await signatureResponse.json();

    // The signature covers exactly these parameters; adding any other field
    // invalidates it, which is what stops a signed upload being re-pointed.
    const payload = new FormData();
    payload.append("file", file);
    payload.append("api_key", signed.apiKey);
    payload.append("timestamp", String(signed.timestamp));
    payload.append("signature", signed.signature);
    payload.append("folder", signed.folder);
    payload.append("use_filename", "true");
    payload.append("unique_filename", "true");
    payload.append("overwrite", "false");

    const uploaded = await fetch(signed.uploadUrl, { method: "POST", body: payload });
    if (!uploaded.ok) {
      return { ok: false, error: "Cloudinary rejected the upload. Check the file and try again." };
    }
    const asset = await uploaded.json();

    // Register it in the media library. A failure here is not fatal — the image
    // is already in Cloudinary and already attached to the record being edited.
    fetch("/api/admin/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        publicId: asset.public_id,
        alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        folder,
      }),
    }).catch(() => undefined);

    return {
      ok: true,
      image: {
        url: asset.url,
        secureUrl: asset.secure_url,
        publicId: asset.public_id,
        width: asset.width,
        height: asset.height,
        format: asset.format,
      },
    };
  } catch {
    return { ok: false, error: "The upload failed. Check your connection and try again." };
  }
}
