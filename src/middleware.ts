import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * First gate on the admin area.
 *
 * This verifies the session token's SIGNATURE and EXPIRY, which the Edge
 * runtime can do — `jose` is Web Crypto based — and nothing more. It cannot
 * reach the database, so it cannot know whether the account still exists, is
 * still active, still holds the role the token claims, or whether its session
 * has been revoked. Those are decided by `requireAdmin()` on the server, which
 * re-reads the user on every privileged call.
 *
 * So this is not the security boundary and must never be treated as one. It
 * exists for two reasons:
 *
 *  1. **Correct status codes.** Checking only for the cookie's presence let a
 *     forged or expired token through to the page, where `redirect()` runs
 *     inside an already-streaming response — the browser follows it, but the
 *     HTTP status is 200 and a full render has been paid for. Rejecting an
 *     unverifiable token here returns a real 307 before any of that.
 *  2. **Cost.** A drive-by request to /admin no longer opens a database
 *     connection or renders an app shell just to be turned away.
 *
 * A token that passes here has proved only that this server signed it and that
 * it has not expired.
 */

const COOKIE_NAME = "apc_admin_session";

/**
 * Encoded lazily and cached: `TextEncoder` on every request is wasteful, and
 * reading the variable at module scope would throw at import time on a
 * deployment where it is missing, taking the whole middleware down rather than
 * failing one request closed.
 */
let cachedKey: Uint8Array | null = null;

function secretKey(): Uint8Array | null {
  if (cachedKey) return cachedKey;
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

async function hasValidSignature(token: string): Promise<boolean> {
  const key = secretKey();
  // Without a usable secret nothing can be verified. Fail closed: the server
  // would reject the request anyway, and letting it through would mean a
  // misconfigured deployment quietly serving the admin shell.
  if (!key) return false;

  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    // Expired, tampered with, or signed by a rotated secret.
    return false;
  }
}

function reject(request: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  // Return the visitor where they were headed once they have signed in.
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page and the auth endpoints must stay reachable when signed out.
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return reject(request, pathname);

  if (!(await hasValidSignature(token))) {
    const response = reject(request, pathname);
    // Clear the dead cookie so the browser stops sending it and the visitor is
    // not bounced on every subsequent navigation.
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
