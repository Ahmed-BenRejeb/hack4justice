"use client";

/**
 * Business sign-up card, in the shadcn login-03 layout: the organisation and its first account in
 * one step. The account opens the business space directly once created.
 */
import { useActionState, type JSX } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp, type AuthFormState } from "@/lib/auth-actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/config";

const INITIAL_STATE: AuthFormState = { error: null, values: {} };

/** Organisation name and matricule fiscal, then the account's email and password. */
export function SignUpForm(): JSX.Element {
  const [state, action, pending] = useActionState(signUp, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Inscrire votre entreprise</CardTitle>
          <CardDescription>Le compte créé dépose et suit les dossiers de paiement de l’entreprise.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="organisation_name">Nom ou raison sociale</FieldLabel>
                <Input
                  id="organisation_name"
                  name="organisation_name"
                  autoComplete="organization"
                  defaultValue={state.values.organisation_name}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tax_id">Matricule fiscal</FieldLabel>
                <Input
                  id="tax_id"
                  name="tax_id"
                  autoComplete="off"
                  className="font-mono"
                  defaultValue={state.values.tax_id}
                  required
                />
              </Field>
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  aria-describedby="password-hint"
                  required
                />
                <FieldDescription id="password-hint">Au moins {PASSWORD_MIN_LENGTH} caractères.</FieldDescription>
              </Field>
              <FieldError>{state.error}</FieldError>
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Création du compte…" : "Créer le compte"}
                </Button>
                <FieldDescription className="text-center">
                  Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
