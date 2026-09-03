/**
 * Ambient declarations for non-code imports.
 *
 * Next.js compiles stylesheets itself, so `import "./globals.css"` has no
 * TypeScript meaning. The project's pinned TypeScript resolves it via
 * `next-env.d.ts`, but newer language-server versions report TS2882
 * ("Cannot find module or type declarations for side-effect import") on it.
 *
 * Declaring the modules here fixes that properly, rather than papering over it
 * with a `@ts-expect-error` that then becomes an "unused directive" error under
 * the pinned compiler.
 */

declare module "*.css";
declare module "*.scss";
declare module "*.sass";
