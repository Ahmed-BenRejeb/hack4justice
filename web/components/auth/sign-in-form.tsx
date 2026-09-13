"use client";

/**
 * Sign-in card, adapted from the shadcn login-03 block: email and password, then the space the
 * account's role opens. Only businesses sign up here; other accounts are opened by the administration.
 */
import { useActionState, type JSX } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, type AuthFormState } from "@/lib/auth-actions";

const INITIAL_STATE: AuthFormState = { error: null, values: {} };

/** Email and password; a refusal is announced under the fields. */
export function SignInForm(): JSX.Element {
  const [state, action, pending] = useActionState(signIn, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Connexion</CardTitle>
          <CardDescription>Accédez à votre espace avec votre adresse e-mail.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.values.email}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </Field>
              <FieldError>{state.error}</FieldError>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Connexion…" : "Se connecter"}
                </Button>
                <FieldDescription className="text-center">
                  Pas encore de compte ? <Link href="/inscription">Inscrire votre entreprise</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Les comptes agent, administrateur et expert-comptable sont ouverts par l’administration.
      </FieldDescription>
    </div>
  );
}
