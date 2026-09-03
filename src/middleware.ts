import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge guard for the administrative area.
 *
 * This is a first line of defence only — a coarse gate that keeps /admin off the
 * public site entirely while no identity provider is connected. It is NOT the
 * authorisation check: every admin route and server action still calls
 * `requireAdmin()` on the server (see `src/lib/server/auth.ts`), because
 * middleware alone must never be the thing standing between the public and a
 * database.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (process.env.ADMIN_ENABLED !== "true") {
      // Rewrite rather than redirect, so the area is indistinguishable from a
      // route that does not exist.
      return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
    }

    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
