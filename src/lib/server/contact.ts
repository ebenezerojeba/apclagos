import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { connectToDatabase } from "./db";
import { ContactMessage } from "./models";

/**
 * Contact form: validation, spam protection and delivery.
 *
 * Three independent defences, none of which inconveniences a real visitor:
 *
 *  1. A signed, timestamped token issued when the form is rendered. It proves
 *     the submission came from a page this server produced, and it expires.
 *     Submissions that arrive implausibly fast are rejected as automated.
 *  2. A honeypot field, visually hidden and marked aria-hidden, that a human
 *     never fills in.
 *  3. A per-IP rate limit.
 *
 * The secret never leaves the server: only the opaque token reaches the client.
 */

const SECRET =
  process.env.CONTACT_FORM_SECRET ??
  // A build without a configured secret still runs; submissions are rejected
  // rather than silently accepted, and the reason is logged once at startup.
  "";

/** Tokens older than this are rejected. */
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
/** A form completed faster than this was almost certainly not typed. */
const MIN_FILL_MS = 2_500;

export const contactSubjects = [
  "General enquiry",
  "Membership",
  "Media and press",
  "Local council enquiry",
  "Elections and candidates",
  "Report a correction",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address.")
    .max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+()\d\s-]*$/, "Please enter a valid telephone number.")
    .optional()
    .or(z.literal("")),
  subject: z.enum(contactSubjects),
  message: z
    .string()
    .trim()
    .min(20, "Please give us a little more detail (at least 20 characters).")
    .max(4000, "Message is too long — please keep it under 4,000 characters."),
  /** Honeypot. Must be empty. */
  /**
   * Honeypot. Deliberately permissive: the schema must ACCEPT a filled value so
   * the route can answer with a fake success. Rejecting it here would return
   * `{"website": "String must contain at most 0 character(s)"}`, telling a bot
   * exactly which field is the trap and how to beat it next time.
   */
  website: z.string().max(200).optional(),
  token: z.string().min(1, "This form has expired. Please reload the page."),
});

export type ContactInput = z.infer<typeof contactSchema>;

/* -------------------------------------------------------------------------- */
/*  Token                                                                      */
/* -------------------------------------------------------------------------- */

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

/** Issued when the contact page renders; verified on submit. */
export function issueFormToken(now = Date.now()): string {
  if (!SECRET) return "";
  const issuedAt = String(now);
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyFormToken(
  token: string,
  now = Date.now(),
): { ok: true } | { ok: false; reason: string } {
  if (!SECRET) {
    return {
      ok: false,
      reason: "The contact form is not configured. Set CONTACT_FORM_SECRET.",
    };
  }

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return { ok: false, reason: "Malformed token." };

  const expected = Buffer.from(sign(issuedAt));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return { ok: false, reason: "Invalid token." };
  }

  const age = now - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0) {
    return { ok: false, reason: "Invalid token." };
  }
  if (age > TOKEN_TTL_MS) {
    return { ok: false, reason: "This form has expired. Please reload the page." };
  }
  if (age < MIN_FILL_MS) {
    return { ok: false, reason: "Submission rejected. Please try again." };
  }

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/*  Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/**
 * In-process fixed-window limiter. Adequate for a single instance; swap the
 * body for Redis (or the API's own limiter) when the site runs on more than one.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, now = Date.now()) {
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1 };
  }

  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: MAX_PER_WINDOW - entry.count };
}

/** Periodically drop expired buckets so the map cannot grow without bound. */
export function pruneRateLimiter(now = Date.now()) {
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

/* -------------------------------------------------------------------------- */
/*  Delivery                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Records a validated submission.
 *
 * The message is written to MongoDB, and `delivered` reports whether that
 * actually happened. It previously returned `delivered: true` after doing
 * nothing but `console.info` the subject line - the sender's name and their
 * entire message were discarded, and the form told them it had been delivered.
 * For a party's public contact channel that is silent loss of constituent
 * correspondence behind a false confirmation.
 *
 * Storing rather than emailing is deliberate. An inbox can fill up, a provider
 * can be misconfigured and an address can change hands; the database is the
 * record, and the admin inbox at `/admin/messages` is where it is read. Email
 * notification can be layered on later without putting the message at risk,
 * because by then it is already saved.
 *
 * If the write fails the caller is told plainly that the message was not
 * received, and the full submission is logged server-side so nothing is lost
 * while the database is unreachable.
 */
export async function deliverContactMessage(
  input: Omit<ContactInput, "token" | "website">,
): Promise<{ delivered: boolean; detail?: string }> {
  try {
    await connectToDatabase();
    const saved = await ContactMessage.create({
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      subject: input.subject,
      message: input.message,
      status: "new",
    });

    // Identify the record, never the sender: an email address in a log line is
    // personal data sitting somewhere nobody audits.
    console.info(`[contact] message stored (${saved._id})`);
    return { delivered: true };
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    // Last resort. The submission is on its way to being lost, so the whole of
    // it goes to the server log where an operator can still retrieve it.
    console.error(`[contact] could not store message (${name}) - full submission follows`);
    console.error(JSON.stringify(input));

    return {
      delivered: false,
      detail:
        "Your message could not be saved just now. Please try again shortly, " +
        "or contact the secretariat directly using the details on this page.",
    };
  }
}
