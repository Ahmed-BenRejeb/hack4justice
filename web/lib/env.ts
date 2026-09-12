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

/** Origin of the Python backend, without a trailing slash and without the /api/v1 prefix. */
export function getApiBaseUrl(): string {
  const raw = requireEnv("API_BASE_URL");
  // Reject malformed values here so the proxy never builds a relative or garbage URL.
  if (!URL.canParse(raw)) {
    throw new Error("Invalid environment variable: API_BASE_URL is not an absolute URL");
  }
  return raw.replace(/\/+$/, "");
}
