import "server-only";

import { headers } from "next/headers";

/**
 * Authentication boundary for the administrative area.
 *
 * There is deliberately NO credential check, no hard-coded password and no
 * client-side "isAdmin" flag in this codebase. Shipping a placeholder login
 * would be worse than shipping none: it looks like protection while providing
 * none, and it is exactly the kind of thing that survives to production.
 *
 * Instead this module defines the contract the real identity provider must
 * satisfy, and fails closed until one is connected:
 *
 *   - `ADMIN_ENABLED` is false by default, and every /admin route returns 404.
 *   - `getSession()` returns null until `resolveSession` is implemented against
 *     a real provider (Auth.js, Clerk, an OIDC gateway, or the party's own
 *     Express API issuing signed, httpOnly session cookies).
 *   - `requireAdmin()` is the single call every server action and admin route
 *     must make before touching data.
 *
 * WIRING IT UP
 *   1. Choose a provider and set its variables in `.env.local`.
 *   2. Implement `resolveSession()` below — read the session cookie or bearer
 *      token, verify it server-side, and map the provider's claims onto
 *      `AdminSession`.
 *   3. Set ADMIN_ENABLED=true.
 * Nothing else in the application needs to change.
 */

export type AdminRole = "owner" | "editor" | "contributor";

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Unix ms. `requireAdmin` rejects sessions past this. */
  expiresAt: number;
}

/** Capability check — routes ask for a capability, never for a role directly. */
const ROLE_CAPABILITIES: Record<AdminRole, string[]> = {
  owner: ["read", "write", "publish", "delete", "manage-users"],
  editor: ["read", "write", "publish"],
  contributor: ["read", "write"],
};

export type AdminCapability =
  (typeof ROLE_CAPABILITIES)[AdminRole][number];

export function isAdminEnabled(): boolean {
  return process.env.ADMIN_ENABLED === "true";
}

export function can(session: AdminSession, capability: string): boolean {
  return ROLE_CAPABILITIES[session.role].includes(capability);
}

/**
 * Resolves the current administrator from the request.
 *
 * NOT IMPLEMENTED — returns null so the admin area stays closed. Replace the
 * body with a real verification against your identity provider. The `headers()`
 * call is retained to make the request-scoped nature of this function explicit.
 */
async function resolveSession(): Promise<AdminSession | null> {
  await headers();

  // Example shape once a provider is connected:
  //
  //   const token = (await cookies()).get("__Host-session")?.value;
  //   if (!token) return null;
  //   const claims = await verifyJwt(token, process.env.AUTH_SECRET!);
  //   return {
  //     userId: claims.sub,
  //     email: claims.email,
  //     name: claims.name,
  //     role: claims.role as AdminRole,
  //     expiresAt: claims.exp * 1000,
  //   };

  return null;
}

export async function getSession(): Promise<AdminSession | null> {
  if (!isAdminEnabled()) return null;
  const session = await resolveSession();
  if (!session) return null;
  if (session.expiresAt <= Date.now()) return null;
  return session;
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * The single gate. Every admin route handler and server action must call this
 * before reading or writing anything.
 */
export async function requireAdmin(
  capability: AdminCapability = "read",
): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!can(session, capability)) throw new ForbiddenError();
  return session;
}
