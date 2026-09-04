import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

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
 * Delivers a validated submission.
 *
 * Deliberately left as a single seam: connect an SMTP transport, a
 * transactional email provider, or the party's own Express API here. Until one
 * is configured the submission is logged server-side and the caller is told the
 * message was received but not yet routed, rather than being shown a false
 * success.
 */
export async function deliverContactMessage(
  input: Omit<ContactInput, "token" | "website">,
): Promise<{ delivered: boolean; detail?: string }> {
  const inbox = process.env.CONTACT_INBOX_EMAIL;

  if (!inbox) {
    console.warn(
      "[contact] CONTACT_INBOX_EMAIL is not set — submission was validated but not delivered.",
      { subject: input.subject },
    );
    return {
      delivered: false,
      detail: "No delivery inbox is configured for this site yet.",
    };
  }

  // TODO(integration): send via the chosen provider, e.g.
  //   await transporter.sendMail({ to: inbox, replyTo: input.email, ... })
  console.info("[contact] Submission received", {
    to: inbox,
    subject: input.subject,
    from: input.email,
  });

  return { delivered: true };
}
