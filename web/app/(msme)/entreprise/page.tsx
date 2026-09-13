/** MSME entry: upload a payment file. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/msme/how-it-works";
import { OrganisationImpact } from "@/components/msme/organisation-impact";
import { UploadForm } from "@/components/msme/upload-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Déposer un dossier" };

/** Upload form for the signed-in user's organisations, what happens next, then those organisations' own numbers. */
export default async function UploadPage(): Promise<JSX.Element> {
  // The same memoised lookup the layout made, so this costs no second backend call.
  const user = await requireRole("msme", "accountant");
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Espace entreprise"
          title="Déposer un dossier de paiement"
          description="Chahed propose le code de retenue à la source applicable et cite l’article qui le fonde. S’il manque une information, il le dit au lieu de deviner."
        />
        <UploadForm organisations={user.organisations} />
      </div>
      <HowItWorks />
      <OrganisationImpact organisations={user.organisations} />
    </div>
  );
}
