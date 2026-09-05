import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";
import { AdminUser, roleCan, type AdminRole, type AdminUserDoc } from "./models";

/**
 * Admin authentication.
 *
 * Sessions are stateless JWTs in an httpOnly cookie. The alternative — a
 * sessions collection — would mean a database round trip on every request just
 * to learn who is asking, which on serverless is a cold-start-sized cost per
 * page. The usual objection to stateless sessions is that they cannot be
 * revoked; that is handled by `sessionVersion` on the user, which is checked on
 * every privileged call and bumped whenever a password changes or an account is
 * deactivated. A stolen cookie stops working the moment either happens.
 *
 * Two layers, and the distinction matters:
 *
 *   `getSession()`   — reads and verifies the cookie. Cheap, no database.
 *   `requireAdmin()` — verifies AND re-reads the user, checking they are still
 *                      active and their session version still matches. Every
 *                      mutation calls this. Middleware never substitutes for it.
 */

const COOKIE_NAME = "apc_admin_session";
const SESSION_DAYS = 7;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with " +
        "`openssl rand -base64 32` and set it in .env.local and in Vercel.",
    );
  }
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  const secret = process.env.AUTH_SECRET;
  return Boolean(secret && secret.length >= 32);
}

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  sessionVersion: number;
}

/* -------------------------------------------------------------------------- */
/*  Passwords                                                                  */
/* -------------------------------------------------------------------------- */

/** Cost 12: ~250ms per hash, which is the point — it throttles guessing. */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A dummy hash compared against when no user matches.
 *
 * Without it, a request for a non-existent account returns in ~1ms while a
 * request for a real one takes ~250ms, and that difference is a reliable
 * account-enumeration oracle. Comparing against this keeps both paths equal.
 */
const DUMMY_HASH =
  "$2b$12$abcdefghijklmnopqrstuuKq0m8gVPHfB0EJ5s1O1eZTGVYQ8mCLy";

/* -------------------------------------------------------------------------- */
/*  Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export async function createSession(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: AdminRole;
  sessionVersion: number;
}): Promise<void> {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    sv: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Secure everywhere except local http development, where the browser would
    // simply drop the cookie and login would appear to silently fail.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Verifies the cookie. Does NOT touch the database. */
export async function getSession(): Promise<AdminSession | null> {
  if (!isAuthConfigured()) return null;

  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as AdminRole) ?? "contributor",
      sessionVersion: Number(payload.sv ?? 0),
    };
  } catch {
    // Expired, tampered with, or signed by a rotated secret.
    return null;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Sign in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * The gate every admin route handler and server action must pass.
 *
 * Re-reads the user rather than trusting the token alone, because a JWT is a
 * snapshot: it still says "owner" after the account has been demoted or
 * disabled. Middleware is a coarse first pass and is never sufficient on its
 * own — it cannot reach the database, and Next.js runs it before, not instead
 * of, the handler.
 */
export async function requireAdmin(
  capability: "read" | "write" | "publish" | "delete" | "manage-users" | "settings" = "read",
): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();

  await connectToDatabase();
  const user = await AdminUser.findById(session.userId)
    .select("role active sessionVersion email name")
    .lean<Pick<AdminUserDoc, "_id" | "role" | "active" | "sessionVersion" | "email" | "name">>();

  if (!user || !user.active) throw new UnauthorizedError();
  if (user.sessionVersion !== session.sessionVersion) {
    throw new UnauthorizedError("Your session has expired. Please sign in again.");
  }
  if (!roleCan(user.role, capability)) throw new ForbiddenError();

  // Return the freshly read values, not the token's stale copy.
  return {
    userId: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    sessionVersion: user.sessionVersion,
  };
}

/* -------------------------------------------------------------------------- */
/*  Sign in                                                                    */
/* -------------------------------------------------------------------------- */

export type SignInResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Authenticates an email and password.
 *
 * Every failure returns the same message. Distinguishing "no such account"
 * from "wrong password" tells an attacker which addresses are worth attacking.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const generic = "Email address or password is incorrect.";

  if (!isAuthConfigured()) {
    return { ok: false, error: "Authentication is not configured on this deployment." };
  }

  await connectToDatabase();
  const user = await AdminUser.findOne({ email: email.trim().toLowerCase() })
    .select("+passwordHash email name role active sessionVersion")
    .exec();

  if (!user || !user.active) {
    // Burn the same time as a real comparison.
    await verifyPassword(password, DUMMY_HASH);
    return { ok: false, error: generic };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false, error: generic };

  user.lastLoginAt = new Date();
  await user.save();

  await createSession({
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionVersion: user.sessionVersion,
  });

  return { ok: true };
}

/** True when no administrator exists yet — gates first-run setup. */
export async function hasAnyAdmin(): Promise<boolean> {
  await connectToDatabase();
  return (await AdminUser.estimatedDocumentCount()) > 0;
}
