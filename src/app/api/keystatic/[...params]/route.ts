import { NextResponse } from "next/server";
import { makeRouteHandler } from "@keystatic/next/route-handler";
import keystaticConfig from "../../../../../keystatic.config";
import { isEditingAvailable } from "@/lib/keystatic-env";

/**
 * Keystatic's API surface: the GitHub OAuth exchange and the read/write calls
 * the editing UI makes. Authorisation lives inside the handler — in GitHub mode
 * it is the repository's collaborator list, so access is granted and revoked
 * through GitHub rather than anything stored here.
 *
 * `makeRouteHandler` throws on import when the GitHub credentials are missing,
 * which would fail the whole production build. Guarding the call keeps the
 * public site deployable before the editor has been set up.
 */

function notConfigured() {
  return NextResponse.json(
    {
      error:
        "The content editor is not configured for this deployment. See /keystatic for the remaining steps.",
    },
    { status: 503 },
  );
}

const handlers = isEditingAvailable
  ? makeRouteHandler({ config: keystaticConfig })
  : { GET: notConfigured, POST: notConfigured };

export const GET = handlers.GET;
export const POST = handlers.POST;
