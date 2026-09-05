/**
 * Creates or updates an administrator account.
 *
 *   npm run admin:create -- --email you@example.org --name "Your Name"
 *
 * The password is read from a prompt with echo suppressed, so it never appears
 * in your shell history, in `ps` output, or in a CI log. Nothing here is
 * hardcoded and no account is created for anyone who has not been named on the
 * command line.
 *
 * The AdminUser shape is duplicated below rather than imported, because every
 * model in `src/lib/server/models` imports `server-only`, which throws outside
 * a Next.js server build by design. Keep this schema in step with
 * `src/lib/server/models/system.ts` — it is deliberately the smallest subset
 * needed to write one row.
 */

// Side-effect import: applies DEV_DNS_SERVERS if it is set, otherwise a no-op.
// Must come before mongoose, so the driver's SRV lookup uses the new resolver.
import "./dns-override.mjs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";
import { stdin, stdout, argv, exit, env } from "node:process";

const ROLES = ["owner", "editor", "contributor"];
const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD = 12;

/** True only when a human is at a keyboard; see askHidden below. */
const interactive = Boolean(stdin.isTTY && stdout.isTTY);

/** @type {import("node:readline").Interface | null} */
let rl = null;

/** Releases stdin so the process exits instead of waiting on an open handle. */
function closePrompt() {
  rl?.close();
  rl = null;
}

/* -- Arguments -------------------------------------------------------------- */

function arg(name) {
  const index = argv.indexOf(`--${name}`);
  return index > -1 ? argv[index + 1] : undefined;
}

const email = (arg("email") ?? "").trim().toLowerCase();
const name = (arg("name") ?? "").trim();
const role = (arg("role") ?? "owner").trim();

function fail(message) {
  closePrompt();
  console.error(`\n  ✖ ${message}\n`);
  exit(1);
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail('Pass a valid address:  npm run admin:create -- --email you@example.org --name "Your Name"');
}
if (!name) fail('Pass a name:  --name "Your Name"');
if (!ROLES.includes(role)) fail(`--role must be one of: ${ROLES.join(", ")}`);

if (!env.MONGODB_URI) {
  fail(
    "MONGODB_URI is not set.\n    Run through the npm script, which loads .env.local:\n" +
      "      npm run admin:create -- --email … --name …",
  );
}

/* -- Password prompt -------------------------------------------------------- */

/**
 * Prompts for a password without echoing it back to the terminal.
 *
 * Two quite different mechanisms, because readline behaves differently on a
 * pipe than on a terminal:
 *
 *  - Interactive: one readline interface, reused across prompts, with a data
 *    listener that redraws the prompt after every keystroke so the characters
 *    never appear. A fresh interface per question would close stdin after the
 *    first one.
 *
 *  - Piped: stdin is drained once and served a line at a time. readline emits
 *    every buffered line as soon as the pipe delivers it, so a second
 *    `rl.question` asked after the stream has ended simply never fires - the
 *    process then hangs on an unsettled await rather than failing. Draining
 *    up front sidesteps that entirely, and there is nothing to suppress on a
 *    pipe anyway (`clearLine` throws on a non-TTY stdout).
 *
 * The piped path exists for scripted setup:
 *
 *   printf 'PW\nPW\n' | npm run admin:create -- --email ... --name ...
 *
 * Prefer the interactive prompt where you can. A password sent through a pipe
 * can end up in shell history or a CI log, which is the whole thing this is
 * otherwise avoiding.
 */

/** @type {string[] | null} Lines drained from a non-terminal stdin. */
let piped = null;

async function drainStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks)
    .toString("utf8")
    .split(/\r?\n/);
}

async function askHidden(question) {
  if (!interactive) {
    piped ??= await drainStdin();
    const value = piped.shift();
    if (value === undefined) {
      fail("Ran out of input on stdin. Two lines are needed: password, then confirmation.");
    }
    return value.trim();
  }

  rl ??= createInterface({ input: stdin, output: stdout, terminal: true });
  const active = rl;

  return new Promise((resolve) => {
    const onData = (char) => {
      // Redraw the prompt without the characters just typed.
      if (![`\n`, `\r`, ``].includes(char.toString())) {
        stdout.clearLine(0);
        stdout.cursorTo(0);
        stdout.write(question);
      }
    };

    stdin.on("data", onData);
    active.question(question, (answer) => {
      stdin.removeListener("data", onData);
      stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

/* -- Schema (mirror of src/lib/server/models/system.ts) --------------------- */

const adminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "contributor" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    sessionVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const AdminUser =
  mongoose.models.AdminUser ?? mongoose.model("AdminUser", adminUserSchema);

/* -- Run -------------------------------------------------------------------- */

const password = await askHidden("  Password (min 12 characters, not echoed): ");
if (password.length < MIN_PASSWORD) {
  fail(`Password must be at least ${MIN_PASSWORD} characters.`);
}
const confirm = await askHidden("  Confirm password: ");
if (password !== confirm) fail("Passwords do not match.");

console.log("\n  Connecting…");

try {
  await mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
    // Belt and braces: if the URI carries no database path, Mongoose would
    // otherwise write to `test`.
    dbName: env.MONGODB_DB_NAME || "apclagos",
  });
} catch (error) {
  fail(
    `Could not reach MongoDB (${error.name}).\n` +
      "    Check the connection string, the database user's password, and that\n" +
      "    your current IP is allowed under Atlas → Network Access.\n" +
      "    If the message mentions querySrv, EBADRESP or ETIMEOUT, the fault is\n" +
      "    your local DNS, not your credentials: set DEV_DNS_SERVERS=8.8.8.8,8.8.4.4\n" +
      "    in .env.local and run this again.",
  );
}

const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const existing = await AdminUser.findOne({ email }).select("_id role");

if (existing) {
  // Bumping sessionVersion signs out every existing session for this account,
  // which is what you want after a password reset.
  await AdminUser.updateOne(
    { _id: existing._id },
    { $set: { name, role, passwordHash, active: true }, $inc: { sessionVersion: 1 } },
  );
  console.log(`\n  ✔ Updated ${email} (role: ${role}). Existing sessions signed out.\n`);
} else {
  await AdminUser.create({ email, name, role, passwordHash, active: true, sessionVersion: 1 });
  console.log(`\n  ✔ Created ${email} (role: ${role}).\n`);
}

console.log(`  Database: ${mongoose.connection.name}`);
console.log("  Sign in at /admin/login\n");

await mongoose.disconnect();
closePrompt();
exit(0);
