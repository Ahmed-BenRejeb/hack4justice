"use server";

/**
 * Sign-in, sign-up and sign-out, run on the server so the session token is only ever written to
 * an HttpOnly cookie (A3). Each refusal becomes one French sentence here: the backend holds no
 * interface copy (D-039).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "./api-types";
import { PASSWORD_MIN_LENGTH } from "./config";
import { getApiBaseUrl } from "./env";
import { ROLE_HOME, SESSION_COOKIE, setSessionCookie } from "./session";

/**
 * What a sign-in or sign-up form shows after an attempt that did not open a session. `values`
 * refills what was typed, since the form resets after its action; a password is never sent back.
 */
export interface AuthFormState {
  error: string | null;
  values: Record<string, string>;
}

const NOT_COMPLETED = "La demande n’a pas abouti. Réessayez dans un instant.";

/** Posts JSON to the backend; null when it cannot be reached. */
async function post(path: string, body: unknown, token?: string): Promise<Response | null> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    return await fetch(`${getApiBaseUrl()}/api/v1${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/** Stores the session a successful response carries and opens the role's space, or explains the refusal. */
async function openSession(
  response: Response | null,
  refusals: Record<number, string>,
  values: Record<string, string>,
): Promise<AuthFormState> {
  if (!response?.ok) {
    return { error: (response && refusals[response.status]) ?? NOT_COMPLETED, values };
  }
  const session = (await response.json()) as AuthSession;
  await setSessionCookie(session.token, session.expires_at);
  redirect(ROLE_HOME[session.user.role]);
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** POST /auth/login with the form's email and password. */
export async function signIn(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = text(formData, "email");
  const response = await post("/auth/login", { email, password: text(formData, "password") });
  const wrongCredentials = "Adresse e-mail ou mot de passe incorrect.";
  return openSession(response, { 401: wrongCredentials, 422: wrongCredentials }, { email });
}

/** POST /auth/signup: creates the business and its first account, and signs that account in. */
export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = {
    organisation_name: text(formData, "organisation_name"),
    tax_id: text(formData, "tax_id"),
    email: text(formData, "email"),
  };
  const response = await post("/auth/signup", {
    email: values.email,
    password: text(formData, "password"),
    organisation: { name: values.organisation_name, tax_id: values.tax_id },
  });
  return openSession(
    response,
    {
      409: "Un compte existe déjà pour cette adresse e-mail ou ce matricule fiscal.",
      422: `Vérifiez les champs : une adresse e-mail valide et un mot de passe d’au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    },
    values,
  );
}

/** Ends the session on the backend, forgets the cookie, and returns to sign-in. */
export async function signOut(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  // Best effort on the backend: the cookie is deleted either way, so this browser is signed out.
  if (token) await post("/auth/logout", {}, token);
  store.delete(SESSION_COOKIE);
  redirect("/connexion");
}
