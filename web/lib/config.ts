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

/** Re-fetch interval for the capture link a laptop shows, so the review opens soon after the phone files the document. */
export const CAPTURE_POLL_MS = 2000;

/** Longest side, in pixels, a photo is reduced to before upload; mirrors MAX_PAGE_PIXELS in api/app/extraction/photos.py. */
export const PHOTO_MAX_PIXELS = 3000;

/** JPEG quality of a reduced photo: a fraction of the original's size, still sharp enough for OCR. */
export const PHOTO_JPEG_QUALITY = 0.85;
