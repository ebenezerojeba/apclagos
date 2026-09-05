import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, ForbiddenError, UnauthorizedError } from "@/lib/server/auth";
import {
  createUploadSignature,
  isCloudinaryConfigured,
  UPLOAD_FOLDERS,
  verifyUpload,
} from "@/lib/server/cloudinary";
import { connectToDatabase } from "@/lib/server/db";
import { Media } from "@/lib/server/models";

/**
 * Signed direct upload.
 *
 * GET  — issues a signature the browser uses to POST one file straight to
 *        Cloudinary. The API secret never leaves this server.
 * POST — records what Cloudinary returned, after re-checking with Cloudinary
 *        that the asset genuinely exists. Without that check an authenticated
 *        session could be used to write an arbitrary attacker-chosen URL into
 *        the database.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const folderSchema = z.enum(
  Object.keys(UPLOAD_FOLDERS) as [keyof typeof UPLOAD_FOLDERS],
);

function authError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin("write");
  } catch (error) {
    return authError(error) ?? NextResponse.json({ error: "Unavailable." }, { status: 500 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Media uploads are not configured on this deployment." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const parsed = folderSchema.safeParse(url.searchParams.get("folder") ?? "general");
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown upload folder." }, { status: 400 });
  }

  return NextResponse.json(createUploadSignature(parsed.data));
}

const recordSchema = z.object({
  publicId: z.string().min(1).max(300),
  alt: z.string().trim().min(1, "Alternative text is required.").max(300),
  caption: z.string().trim().max(500).optional(),
  credit: z.string().trim().max(200).optional(),
  folder: folderSchema.optional(),
});

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin("write");
  } catch (error) {
    return authError(error) ?? NextResponse.json({ error: "Unavailable." }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = recordSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 400 },
    );
  }

  // Trust Cloudinary, not the browser, for the asset's real dimensions.
  const asset = await verifyUpload(parsed.data.publicId);
  if (!asset) {
    return NextResponse.json(
      { error: "That upload could not be verified with Cloudinary." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const media = await Media.findOneAndUpdate(
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
      folder: parsed.data.folder,
      alt: parsed.data.alt,
      caption: parsed.data.caption,
      credit: parsed.data.credit,
      uploadedBy: session.userId,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return NextResponse.json({ ok: true, media });
}
