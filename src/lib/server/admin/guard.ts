import "server-only";

import {
  ForbiddenError,
  UnauthorizedError,
  requireAdmin,
  type AdminSession,
} from "../auth";
import { connectToDatabase, isDatabaseConfigured } from "../db";
import type { ActionState } from "./forms";

/**
 * The gate in front of every admin mutation.
 *
 * Server actions are public HTTP endpoints. Next.js gives each one an
 * unguessable id, but that is obscurity, not authorisation — anything reachable
 * from a browser must check permission itself. Rendering the form behind a
 * session check is not enough, because the action can be invoked without ever
 * loading the page that contains it.
 *
 * `requireAdmin` re-reads the user on every call rather than trusting the
 * session cookie's copy, so a demoted or deactivated account loses access
 * immediately instead of when their token happens to expire.
 */

export type Capability =
  | "read"
  | "write"
  | "publish"
  | "delete"
  | "manage-users"
  | "settings";

export type Guarded =
  | { ok: true; session: AdminSession }
  | { ok: false; state: ActionState };

export async function guard(capability: Capability): Promise<Guarded> {
  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      state: {
        ok: false,
        error: "The database is not configured on this deployment, so nothing can be saved.",
      },
    };
  }

  try {
    const session = await requireAdmin(capability);
    await connectToDatabase();
    return { ok: true, session };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        state: { ok: false, error: `${error.message} Open the sign-in page in a new tab, then try again.` },
      };
    }
    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        state: {
          ok: false,
          error: "Your account does not have permission to make this change.",
        },
      };
    }
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[admin] guard failed: ${name}`);
    return {
      ok: false,
      state: { ok: false, error: "Could not verify your session. Please try again." },
    };
  }
}

/**
 * Publishing is a separate capability from writing.
 *
 * A contributor may draft anything but may not put it in front of the public.
 * Rather than refuse the whole save, callers downgrade the status — the work is
 * kept, and the record waits for an editor.
 */
export function statusFor(
  requested: string | undefined,
  role: string,
): "draft" | "published" | "archived" {
  const value = requested === "published" || requested === "archived" ? requested : "draft";
  if (value === "published" && role === "contributor") return "draft";
  return value;
}
