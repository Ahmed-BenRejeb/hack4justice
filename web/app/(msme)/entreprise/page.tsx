/** MSME entry: upload a payment file. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/msme/how-it-works";
import { UploadForm } from "@/components/msme/upload-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Déposer un dossier" };

/** Upload form followed by what happens next. */
export default function UploadPage(): JSX.Element {
  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Espace entreprise"
          title="Déposer un dossier de paiement"
          description="Chahed lit la facture ou le dossier de paiement, propose le code de retenue à la source applicable et cite l’article qui le fonde. Lorsqu’une information manque, il le dit au lieu de deviner."
        />
        <UploadForm />
      </div>
      <HowItWorks />
    </div>
  );
}
