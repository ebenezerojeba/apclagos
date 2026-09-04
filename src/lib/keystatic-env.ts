/**
 * Whether the content editor is usable in this environment.
 *
 * The public site must build and deploy whether or not the CMS has been set up
 * — the site is the product, the editor is a tool. Without this check Keystatic
 * throws while collecting page data and takes the entire deployment down with
 * it, which is a very bad trade for an unconfigured optional feature.
 */

/**
 * Development runs in local mode: no credentials, writes straight to the
 * working tree. `next build` and `next start` both set NODE_ENV to production,
 * so this cannot be switched on accidentally in a deployment.
 */
export const isLocalEditing = process.env.NODE_ENV === "development";

/** GitHub mode needs all four values before it can do anything. */
export const isGithubEditingConfigured = Boolean(
  process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
    process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
    process.env.KEYSTATIC_SECRET &&
    process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER &&
    process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO,
);

export const isEditingAvailable = isLocalEditing || isGithubEditingConfigured;

/** Names the pieces that are still missing, for the setup screen. */
export function missingEditingConfig(): string[] {
  return (
    [
      ["NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER", process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER],
      ["NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO", process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO],
      ["KEYSTATIC_GITHUB_CLIENT_ID", process.env.KEYSTATIC_GITHUB_CLIENT_ID],
      ["KEYSTATIC_GITHUB_CLIENT_SECRET", process.env.KEYSTATIC_GITHUB_CLIENT_SECRET],
      ["KEYSTATIC_SECRET", process.env.KEYSTATIC_SECRET],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);
}
