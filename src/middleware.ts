import { NextResponse, type NextRequest } from "next/server";

/**
 * Coarse gate on the admin area.
 *
 * This runs on the Edge runtime, where there is no database and no bcrypt, so
 * it deliberately does NOT decide authorisation. It only checks whether a
 * session cookie is present at all and bounces anonymous requests to the login
 * page — which spares a cold database connection for every drive-by request to
 * /admin.
 *
 * Real authorisation happens in `requireAdmin()` on the server, which verifies
 * the token's signature, re-reads the user, and confirms they are still active
 * with a matching session version. A forged or expired cookie gets past this
 * middleware and is rejected there. Middleware is never the security boundary.
 */
const COOKIE_NAME = "apc_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page and the auth endpoints must stay reachable when signed out.
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/auth")) {
    return NextResponse.next();
  }

  const hasCookie = request.cookies.has(COOKIE_NAME);

  if (!hasCookie) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }
    const login = new URL("/admin/login", request.url);
    // Return the visitor where they were headed once they have signed in.
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
