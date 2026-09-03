import { NextResponse } from "next/server";
import {
  contactSchema,
  deliverContactMessage,
  pruneRateLimiter,
  rateLimit,
  verifyFormToken,
} from "@/lib/server/contact";

export const runtime = "nodejs";
/** Never cached, never statically analysed — this endpoint has side effects. */
export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  return (forwarded?.split(",")[0] ?? real ?? "unknown").trim();
}

export async function POST(request: Request) {
  pruneRateLimiter();

  const limit = rateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Too many messages have been sent from this connection. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds ?? 600) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed request." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    // Field-level messages, so the form can point at the offending input.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors },
      { status: 400 },
    );
  }

  const { token, website, ...message } = parsed.data;

  // Honeypot: a real visitor never sees, let alone fills, this field.
  if (website) {
    // Respond as though it succeeded so a bot learns nothing from the answer.
    return NextResponse.json({ ok: true, delivered: true });
  }

  const tokenCheck = verifyFormToken(token);
  if (!tokenCheck.ok) {
    return NextResponse.json(
      { ok: false, error: tokenCheck.reason },
      { status: 400 },
    );
  }

  const result = await deliverContactMessage(message);

  return NextResponse.json({
    ok: true,
    delivered: result.delivered,
    detail: result.detail,
  });
}
