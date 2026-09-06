/**
 * Optional local DNS override. Importing this module applies it; importing it
 * when `DEV_DNS_SERVERS` is unset does nothing at all.
 *
 * Why it exists: `mongodb+srv://` URIs resolve through a DNS SRV lookup before
 * the driver opens a single socket. Some consumer routers, phone hotspots and
 * captive portals answer SRV queries with a malformed packet. Node reports
 * `querySrv EBADRESP`, which reads like a bad password or a blocked IP even
 * though neither was ever tested. Pointing Node at a resolver that answers
 * correctly fixes it without changing the connection string.
 *
 * This is deliberately a *script*, not application code. It is loaded either by
 * `node --import` ahead of the dev server or by the admin CLI — never bundled,
 * never shipped, and never present in a deployment, where the platform's own
 * resolver is the correct one to use.
 *
 * The real fix is to set a working DNS server on the machine or router. This
 * only stops a bad network from blocking local work in the meantime.
 */

import dns from "node:dns";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Reads one key out of `.env.local`.
 *
 * The dev server loads env files itself, but that happens long after a
 * `--import` preload runs, so this cannot rely on `process.env` being
 * populated. It is a single-key lookup on purpose — this is not a dotenv
 * replacement, and nothing else here needs one.
 */
function fromEnvLocal(key) {
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const contents = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      if (trimmed.slice(0, eq).trim() !== key) continue;
      return trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env.local, or unreadable. Nothing to override.
  }
  return undefined;
}

const raw = process.env.DEV_DNS_SERVERS ?? fromEnvLocal("DEV_DNS_SERVERS");
const servers = (raw ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

/**
 * Makes the override survive into child processes.
 *
 * `next dev` renders in a separate worker process, and that worker is the one
 * that actually opens the MongoDB connection. `--import` applies only to the
 * process it was passed to, so overriding DNS in the parent alone changes
 * nothing that matters. `NODE_OPTIONS` is inherited, so re-declaring the
 * preload there carries it into every worker Next spawns.
 *
 * The guard against re-appending matters: each child runs this module too, and
 * without it `NODE_OPTIONS` would grow by one flag per process generation.
 */
function propagateToChildProcesses() {
  const flag = `--import ${JSON.stringify(import.meta.url)}`;
  const current = process.env.NODE_OPTIONS ?? "";
  if (current.includes(import.meta.url)) return;
  process.env.NODE_OPTIONS = current ? `${current} ${flag}` : flag;
}

/**
 * Whether this process is running on a deployment platform rather than a
 * developer's machine.
 *
 * The earlier version of this guard tested `NODE_ENV === "production"`, which
 * was wrong in a way that silently produced a broken site: `next build` sets
 * `NODE_ENV=production` on a local machine too, so the override was skipped
 * during the build and every prerendered page was generated against an
 * unreachable database. The pages rendered - `safeRead` degrades to an empty
 * result by design - so the build passed and shipped a site with no content in
 * it. Testing for the platform's own marker is what the guard actually meant.
 */
function onDeploymentPlatform() {
  return Boolean(process.env.VERCEL || process.env.CI);
}

if (servers.length > 0) {
  if (onDeploymentPlatform()) {
    console.warn(
      "[dns] DEV_DNS_SERVERS is set but ignored here: it is a local workaround " +
        "and must not be configured on a deployment.",
    );
  } else {
    dns.setServers(servers);
    propagateToChildProcesses();
    // Logged once per process, so seeing it more than once means a worker
    // inherited it correctly rather than something going wrong.
    console.log(`[dns] resolver set to ${servers.join(", ")} (pid ${process.pid})`);
  }
}

export const appliedServers = servers;
