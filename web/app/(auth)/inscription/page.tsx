/** Business sign-up screen. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Créer un compte" };

/** The sign-up card. */
export default function SignUpPage(): JSX.Element {
  return <SignUpForm />;
}
