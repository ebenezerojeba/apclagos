import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Clears the session cookie. Safe to call when already signed out. */
export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
