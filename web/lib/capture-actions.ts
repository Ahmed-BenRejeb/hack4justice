"use server";

/**
 * Makes a phone capture link on the server (G3, D-056). The address its QR code encodes comes from
 * PUBLIC_WEB_URL, configuration client components never read, and the session token stays in its
 * HttpOnly cookie.
 */
import { cookies } from "next/headers";
import type { CaptureLinkCreated } from "./api-types";
import { getApiBaseUrl, getPublicWebUrl } from "./env";
import { SESSION_COOKIE } from "./session";

/** A new link with the address its QR code encodes, or one sentence saying why none was made. */
export type CaptureLinkResult = (CaptureLinkCreated & { url: string }) | { error: string };

const NOT_COMPLETED = "La demande n’a pas abouti. Réessayez dans un instant.";

/** POST /capture/links for one of the signed-in user's organisations. */
export async function createCaptureLink(organisationId: string): Promise<CaptureLinkResult> {
  let publicWebUrl: string;
  let apiBaseUrl: string;
  try {
    publicWebUrl = getPublicWebUrl();
    apiBaseUrl = getApiBaseUrl();
  } catch (error) {
    // Configuration errors name the variable, never its value, so they are safe to show.
    return { error: (error as Error).message };
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const query = new URLSearchParams({ organisation_id: organisationId });
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/v1/capture/links?${query}`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
  } catch {
    return { error: NOT_COMPLETED };
  }
  if (response.status === 401) return { error: "Session expirée. Reconnectez-vous pour continuer." };
  if (!response.ok) return { error: NOT_COMPLETED };

  const link = (await response.json()) as CaptureLinkCreated;
  return { ...link, url: `${publicWebUrl}/capture/${encodeURIComponent(link.token)}` };
}
