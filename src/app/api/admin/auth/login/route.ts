import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/lib/server/auth";
import { isDatabaseConfigured } from "@/lib/server/db";

/**
 * Sign in.
 *
 * Rate limited per IP, because a login endpoint without one is a password
 * guessing service. The window is deliberately generous enough that a person
 * mistyping their password a few times is never locked out.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "unknown").trim();
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "The database is not configured on this deployment." },
      { status: 503 },
    );
  }

  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
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

  try {
    const result = await signIn(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never surface a driver message: it can carry the cluster host.
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[auth] sign-in failed: ${name}`);
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
