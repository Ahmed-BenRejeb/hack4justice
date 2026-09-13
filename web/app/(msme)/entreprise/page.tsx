/** MSME entry: upload a payment file. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/msme/how-it-works";
import { OrganisationImpact } from "@/components/msme/organisation-impact";
import { UploadForm } from "@/components/msme/upload-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Déposer un dossier" };

/** Upload form followed by what happens next, then an organisation's own numbers. */
export default function UploadPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Espace entreprise"
          title="Déposer un dossier de paiement"
          description="Chahed propose le code de retenue à la source applicable et cite l’article qui le fonde. S’il manque une information, il le dit au lieu de deviner."
        />
        <UploadForm />
      </div>
      <HowItWorks />
      <OrganisationImpact />
    </div>
  );
}
