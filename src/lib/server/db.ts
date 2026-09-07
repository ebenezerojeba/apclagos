import "server-only";

import dns from "node:dns";
import mongoose from "mongoose";

/**
 * The single MongoDB connection for the whole application.
 *
 * Serverless is the constraint that shapes this file. Every Vercel invocation
 * may run in a fresh execution context, but contexts are reused between
 * requests — so opening a connection per request would exhaust the Atlas
 * connection limit within minutes of any real traffic, while opening one per
 * *module load* would still reconnect on every cold start.
 *
 * The fix is the standard one: cache the connection promise on `globalThis`,
 * which survives module re-evaluation during hot reload in development and
 * container reuse in production. Caching the *promise* rather than the
 * connection matters — two requests arriving during a cold start both await the
 * same in-flight handshake instead of racing to open two connections.
 *
 * `bufferCommands: false` is deliberate. Mongoose's default is to queue queries
 * against a disconnected client and resolve them later; in a serverless
 * function that turns a connection failure into a silent hang until the
 * platform kills the invocation. Failing immediately gives a real error.
 */

/**
 * Optional local DNS override, applied in whichever process opens the
 * connection.
 *
 * `mongodb+srv://` resolves through a DNS SRV lookup before the driver opens a
 * socket, and some routers and phone hotspots answer SRV queries with a
 * malformed packet - Node reports `querySrv EBADRESP`, which reads like a bad
 * password rather than a broken network.
 *
 * This lived in a `--import` preload that re-declared itself in `NODE_OPTIONS`
 * so Next's worker processes would inherit it. That worked for `next dev` and
 * broke `next build`: every build worker inherited the flag and the build died
 * with `Cannot find module for page: /_document`. Setting the resolver here
 * instead reaches exactly the processes that need it - the ones that talk to
 * MongoDB - and leaves Next's workers alone.
 *
 * It does nothing unless `DEV_DNS_SERVERS` is set, and nothing on a deployment
 * platform, where the platform's own resolver is the correct one.
 */
function applyDevDnsOverride() {
  const configured = process.env.DEV_DNS_SERVERS?.trim();
  if (!configured) return;
  if (process.env.VERCEL || process.env.CI) return;

  const servers = configured
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (servers.length === 0) return;

  try {
    dns.setServers(servers);
  } catch {
    // A malformed value should not stop the application from starting; the
    // connection attempt below will report the real problem.
  }
}

applyDevDnsOverride();

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * The database to use inside the cluster.
 *
 * Atlas hands out a connection string with no database path segment
 * (`...mongodb.net/?appName=Cluster0`). Left alone, Mongoose silently falls
 * back to a database literally called `test`, so the site would appear to
 * work while writing production content somewhere nobody would think to
 * look. Naming it here removes that trap; a database path in the URI still
 * wins if one is ever added, because `MONGODB_DB_NAME` can be set to match.
 */
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "apclagos";

/** Cached across module reloads and warm invocations. */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __apcMongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__apcMongoose ?? {
  conn: null,
  promise: null,
};
globalThis.__apcMongoose = cached;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "MONGODB_URI is not set. The database is required for content; " +
        "set it in .env.local locally and in the Vercel project settings for " +
        "Production, Preview and Development.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/**
 * Opens (or reuses) the connection.
 *
 * Throws `DatabaseNotConfiguredError` when the URI is absent, so a missing
 * variable produces an actionable message rather than a driver-level parse
 * error thirty frames deep.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) throw new DatabaseNotConfiguredError();

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        dbName: MONGODB_DB_NAME,
        // Fail fast rather than sitting on a dead socket for the default 30s;
        // a serverless invocation does not have that long to spare.
        serverSelectionTimeoutMS: 8000,
        // Atlas' free and shared tiers cap connections per cluster. A small
        // pool per execution context leaves headroom for concurrent instances.
        maxPoolSize: 10,
        minPoolSize: 0,
      })
      .catch((error) => {
        // Clear the cache so the next request retries instead of awaiting a
        // permanently rejected promise for the life of the container.
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/** True when a URI is configured at all. Used by health checks and guards. */
export function isDatabaseConfigured(): boolean {
  return Boolean(MONGODB_URI);
}

/**
 * Runs a read against the database, returning `fallback` if anything fails.
 *
 * The public site must degrade rather than collapse: a missing record, a
 * dropped connection or an unconfigured environment should render an empty
 * state, not a 500 across the whole page. Mutations deliberately do NOT use
 * this — a failed write has to surface to the administrator.
 */
export async function safeRead<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    await connectToDatabase();
    return await operation();
  } catch (error) {
    // Log the shape of the failure, never the URI or its credentials.
    const name = error instanceof Error ? error.name : "UnknownError";
    const message = error instanceof Error ? error.message : "";
    console.error(
      `[db] read failed (${context}): ${name}`,
      // Mongoose messages can embed the host; keep only the first clause.
      message.split(",")[0]?.slice(0, 160),
    );
    return fallback;
  }
}
