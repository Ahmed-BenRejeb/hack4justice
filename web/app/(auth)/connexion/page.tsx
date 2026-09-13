/** Sign-in screen. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

/** The sign-in card. */
export default function SignInPage(): JSX.Element {
  return <SignInForm />;
}
