/**
 * UI timing parameters. These are not identity values, so they carry documented
 * defaults here instead of coming from the environment (root CLAUDE.md, configuration rules).
 */

/** Re-fetch interval for an open document, so extraction results appear as the backend produces them. */
export const DOCUMENT_POLL_MS = 1500;

/** Re-fetch interval for the officer queue, so newly pre-qualified files surface without a reload. */
export const QUEUE_POLL_MS = 3000;
