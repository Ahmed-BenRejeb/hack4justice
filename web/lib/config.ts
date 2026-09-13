/**
 * UI parameters. These are not identity values, so they carry documented
 * defaults here instead of coming from the environment (root CLAUDE.md, configuration rules).
 */

/** Shortest password the sign-up form accepts; mirrors PASSWORD_MIN_LENGTH in api/app/config.py, which enforces it. */
export const PASSWORD_MIN_LENGTH = 8;

/** Re-fetch interval for an open document, so a decision or export recorded in another session appears. */
export const DOCUMENT_POLL_MS = 3000;

/** Re-fetch interval for the officer queue, so newly pre-qualified files surface without a reload. */
export const QUEUE_POLL_MS = 3000;
