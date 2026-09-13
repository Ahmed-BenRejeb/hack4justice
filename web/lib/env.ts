/**
 * The only module in web/ that reads process.env (docs/architecture.md section 7).
 *
 * Values are read on each call rather than at import time, so `next build` does not
 * need runtime configuration; a missing value still fails loudly on first use.
 * Error messages name the variable and never echo its value.
 */

/** Reads a required identity value, throwing an error naming the variable when it is absent. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Reads a required absolute URL without its trailing slash, so no caller builds a relative or garbage URL. */
function requireUrl(name: string): string {
  const raw = requireEnv(name);
  if (!URL.canParse(raw)) {
    throw new Error(`Invalid environment variable: ${name} is not an absolute URL`);
  }
  return raw.replace(/\/+$/, "");
}

/** Origin of the Python backend, without a trailing slash and without the /api/v1 prefix. */
export function getApiBaseUrl(): string {
  return requireUrl("API_BASE_URL");
}

/**
 * Origin a phone reaches this app at, encoded in the capture QR code (G3, D-057). Not the laptop's
 * own address: a laptop that opened the app on localhost is not reachable from a phone.
 */
export function getPublicWebUrl(): string {
  return requireUrl("PUBLIC_WEB_URL");
}

/** Whether this is a production build, set by Next.js itself; not an identity value. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
