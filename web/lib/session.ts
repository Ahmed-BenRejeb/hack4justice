/**
 * The signed-in user on the server: the session cookie and who it belongs to (A3).
 *
 * The cookie holds the backend's opaque session token. It is HttpOnly, so browser code never
 * reads it: the proxy (app/api/v1/[...path]/route.ts) and the server code here send it on as
 * the bearer token the backend expects. The backend decides every permission; the checks here
 * only send a person to a screen their role may use.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "./api-types";
import { getApiBaseUrl, isProduction } from "./env";

export const SESSION_COOKIE = "chahed_session";

/** Where each role lands after signing in, or when it opens a space it may not use. */
export const ROLE_HOME: Record<Role, string> = {
  msme: "/entreprise",
  accountant: "/entreprise",
  officer: "/agent",
  admin: "/admin",
};

/** Keeps a new session token until the backend's own expiry. Callable from a server action only. */
export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // The deployed demo is served over HTTPS (D-051); `next dev` runs over plain http.
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

/**
 * The user of this request's session, or null without a valid one. Memoised per request, so a
 * layout and its page share one backend call. An unreachable backend reads as signed out, so the
 * sign-in screen still renders and says so on submit; any other failure throws.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session lookup failed with status ${response.status}`);
  return (await response.json()) as User;
});

/** The signed-in user when their role may use this space; otherwise a redirect to sign-in or to their own space. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
