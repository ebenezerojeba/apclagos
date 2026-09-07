/**
 * Preload that lets a command-line script import the application's real
 * Mongoose models and the data modules they reach:
 *
 *   node --import ./scripts/with-models.mjs <script.mjs>
 *
 * Three obstacles sit between plain `node` and a model file, and all three are
 * resolved here without changing anything under `src/`.
 *
 * **`server-only`.** Every model begins with `import "server-only"`, which is
 * what stops a schema — and the database credentials its module graph reaches
 * — from ever being bundled into client JavaScript. That guard is worth
 * keeping, but the package throws when resolved anywhere except a React Server
 * Component build, so a script cannot import a model at all. It resolves to an
 * empty module here, for scripts only; the guard still holds for every build.
 *
 * **The `@/` alias.** `tsconfig.json` maps `@/*` to `./src/*`. That mapping is
 * a TypeScript and bundler convention with no equivalent in Node's resolver,
 * which reads `@/lib/slug` as a package named `@/lib` and fails.
 *
 * **Extensionless imports.** TypeScript writes `from "./shared"` and maps it to
 * `shared.ts` itself. Node's ESM resolver requires the extension, so a failed
 * resolution is retried with `.ts` and then `/index.ts`.
 *
 * **JSON imports.** Node requires `with { type: "json" }` on every JSON import;
 * webpack and TypeScript do not. The attribute is supplied here rather than
 * written into `src/`, so application code stays idiomatic for the bundler that
 * actually builds it.
 *
 * The alternative to all of this is restating each schema inside every script,
 * which is how a seed script drifts out of step with the collection it writes
 * to: the model gains a required field, the script does not, and the rows it
 * inserts are invalid in a way nothing catches until a page fails to render.
 *
 * `registerHooks` rather than `register`: it runs synchronously in this thread
 * instead of spawning a loader worker, which keeps everything in one file, and
 * `register` is deprecated as of Node 24.
 */
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "./dns-override.mjs";

const EMPTY_MODULE = "data:text/javascript,export{}";
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

/** Retries a failed resolution with the extensions TypeScript would have added. */
function withExtensions(specifier, context, nextResolve) {
  for (const candidate of [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`]) {
    try {
      return withJsonAttribute(nextResolve(candidate, context));
    } catch {
      // Try the next shape.
    }
  }
  return null;
}

/** Node demands an explicit attribute for JSON; the bundler does not. */
function withJsonAttribute(resolved) {
  if (!resolved?.url?.endsWith(".json")) return resolved;
  return { ...resolved, importAttributes: { type: "json" } };
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: EMPTY_MODULE, shortCircuit: true };
    }

    // `@/lib/slug` → `<project>/src/lib/slug`, then the extension retry below.
    if (specifier.startsWith("@/")) {
      const absolute = pathToFileURL(join(SRC, specifier.slice(2))).href;
      try {
        return withJsonAttribute(nextResolve(absolute, context));
      } catch (error) {
        const resolved = withExtensions(absolute, context, nextResolve);
        if (resolved) return resolved;
        throw error;
      }
    }

    try {
      return withJsonAttribute(nextResolve(specifier, context));
    } catch (error) {
      const relative = specifier.startsWith("./") || specifier.startsWith("../");
      const extensionless = !/\.[a-z]+$/i.test(specifier);
      if (!relative || !extensionless) throw error;

      const resolved = withExtensions(specifier, context, nextResolve);
      if (resolved) return resolved;
      throw error;
    }
  },
});
