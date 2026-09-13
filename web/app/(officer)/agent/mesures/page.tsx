/** Officer measurement view: what the pipeline intercepted, counted from its own data (J9, F1). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { BackLink } from "@/components/shared/back-link";
import { PageHeader } from "@/components/shared/page-header";
import { ImpactPanel } from "@/components/officer/impact-panel";

export const metadata: Metadata = { title: "Mesures" };

/** Renders the impact panel under the officer's own header. */
export default function ImpactPage(): JSX.Element {
  return (
    <>
      <BackLink href="/agent">Retour à la file</BackLink>
      <PageHeader
        eyebrow="Administration"
        title="Mesures"
        description="Ce que le système a relevé sur ses propres dossiers, et le bénéfice qui en découle."
      />
      <ImpactPanel />
    </>
  );
}
