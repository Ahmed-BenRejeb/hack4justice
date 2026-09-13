/** Officer measurement view: what the pipeline intercepted, counted from its own data (J9, F1). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { ImpactPanel } from "@/components/officer/impact-panel";

export const metadata: Metadata = { title: "Mesures" };

/** Renders the impact panel under the officer's own header. */
export default function ImpactPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace agent"
        title="Mesures"
        description="Ce que le système a relevé sur ses propres dossiers, et le bénéfice qui en découle."
      />
      <PageGuide
        steps={[
          "Les chiffres sont comptés dans cette base, pour le jeu de démonstration ; aucune projection nationale n’est faite.",
          "Une erreur interceptée est un constat que sa règle déclare comme un problème.",
          "Le bénéfice en heures est dérivé de ces erreurs ; ses deux paramètres sont des estimations, signalées comme telles.",
        ]}
      />
      <ImpactPanel />
    </div>
  );
}
