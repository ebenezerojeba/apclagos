/**
 * PEOPLE — moved to the CMS.
 *
 * Leadership, council chairmen, senators, members of the House of
 * Representatives and the House of Assembly, and candidates are now edited in
 * the admin and stored as JSON under `content/people/**`.
 *
 *   Editing            /keystatic  (see README, "Editing content")
 *   Schema             keystatic.config.ts
 *   Read + mapping     src/lib/cms.ts
 *   Consumed by        src/lib/content.ts
 *
 * Nothing imports this file any more. It is kept only so that anyone who goes
 * looking for the old arrays finds out where they went.
 */

export {};
