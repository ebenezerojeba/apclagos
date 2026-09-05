import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/server/db";
import { cloudinaryMissingVars } from "@/lib/server/cloudinary";
import { isAuthConfigured } from "@/lib/server/auth";

/**
 * Deployment health.
 *
 * Reports only whether each dependency is configured and reachable — never a
 * connection string, a host, a key or a database name. The failure detail is
 * reduced to an error *name*, which is enough to tell "wrong password" from
 * "cannot resolve host" without handing either to a stranger.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // Database: configured, connected, and a real query round-trips.
  if (!isDatabaseConfigured()) {
    checks.database = { ok: false, detail: "MONGODB_URI is not set" };
  } else {
    try {
      await connectToDatabase();
      await mongoose.connection.db?.admin().ping();
      checks.database = { ok: true };
    } catch (error) {
      checks.database = {
        ok: false,
        detail: error instanceof Error ? error.name : "connection failed",
      };
    }
  }

  const missingCloudinary = cloudinaryMissingVars();
  checks.media = missingCloudinary.length
    ? { ok: false, detail: `missing: ${missingCloudinary.join(", ")}` }
    : { ok: true };

  checks.auth = isAuthConfigured()
    ? { ok: true }
    : { ok: false, detail: "AUTH_SECRET is not set or is too short" };

  const healthy = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
