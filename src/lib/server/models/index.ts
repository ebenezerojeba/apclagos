import "server-only";

/**
 * Every model, in one import.
 *
 * Importing from here guarantees each schema is registered before a query runs
 * — Mongoose resolves `ref` strings lazily, so a populate against a model that
 * has not been loaded yet fails at runtime rather than at build.
 */

export * from "./shared";
export * from "./content";
export * from "./people";
export * from "./system";
