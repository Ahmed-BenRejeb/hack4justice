/** Admin corpus verification queue: what still needs a person to check it (D-032). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { VerificationQueue } from "@/components/admin/verification-queue";

export const metadata: Metadata = { title: "Vérification du corpus" };

/** Renders the references awaiting verification. */
export default function CorpusPage(): JSX.Element {
  return <VerificationQueue />;
}
