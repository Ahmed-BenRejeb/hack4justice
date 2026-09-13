/**
 * Display formatting for the French interface. Times are shown in Tunisian local time
 * whatever the workstation's time zone, so an officer and an MSME read the same timestamp.
 */

const LOCALE = "fr-TN";
const TIME_ZONE = "Africa/Tunis";

// ICU's fr-TN data defaults to a 12-hour clock; Tunisian administrative usage is 24-hour.
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
  hourCycle: "h23",
});
const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeStyle: "medium",
  timeZone: TIME_ZONE,
  hourCycle: "h23",
});
const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: "short", timeZone: TIME_ZONE });
const percentFormat = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 });

const SIZE_UNITS = ["o", "Ko", "Mo", "Go"];

/** Formats an ISO timestamp as date and time. Unparseable input is returned unchanged rather than hidden. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormat.format(date);
}

/** Formats a time of day, used for "last refreshed" indicators. */
export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

/** Formats a calendar date (ISO "2026-09-13"), for a confirmation or an expiry with no time of day. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
}

/** Formats a 0-1 confidence as a whole percentage. */
export function formatConfidence(value: number): string {
  return percentFormat.format(value);
}

/** Formats a byte count with French unit abbreviations (octets). */
export function formatFileSize(bytes: number): string {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < SIZE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const number = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: unit === 0 ? 0 : 1 });
  return `${number.format(size)} ${SIZE_UNITS[unit]}`;
}

/** A short, readable reference for an id, for places where the full identifier is noise. */
export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** "0 constat", "1 constat", "2 constats": French takes the singular for zero and one. */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count > 1 ? plural : singular}`;
}

/** Lower-cases and strips diacritics, so a search for "regime" finds "Régime". */
export function foldText(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Returns the value when it is an absolute http(s) URL, null otherwise. Links that come from
 * the backend pass through here so a stored `javascript:` URL can never become clickable.
 */
export function httpUrl(value: string): string | null {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
