import "server-only";

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

const MONGODB_URI = process.env.MONGODB_URI;

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
