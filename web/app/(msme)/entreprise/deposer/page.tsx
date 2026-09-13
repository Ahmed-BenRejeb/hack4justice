/** MSME upload: file a payment document. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { HowItWorks } from "@/components/msme/how-it-works";
import { UploadForm } from "@/components/msme/upload-form";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Déposer un dossier" };

/** Upload form for the signed-in user's organisations, then what happens next. */
export default async function UploadPage(): Promise<JSX.Element> {
  // The same memoised lookup the layout made, so this costs no second backend call.
  const user = await requireRole("msme", "accountant");
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Espace entreprise"
          title="Déposer un dossier de paiement"
          description="Chahed propose le code de retenue à la source applicable et cite l’article qui le fonde. S’il manque une information, il le dit au lieu de deviner."
        />
        <PageGuide
          steps={[
            "Choisissez l’organisation pour laquelle vous déposez, si vous en avez plusieurs.",
            "Joignez le document en PDF ou en image, ou photographiez ses pages une à une.",
            "Sur un ordinateur, « Afficher le code » permet de photographier les pages avec votre téléphone.",
            "Envoyez : le dossier s’ouvre dès que la lecture et l’application des règles sont terminées.",
          ]}
        />
        <UploadForm organisations={user.organisations} />
      </div>
      <HowItWorks />
    </div>
  );
}
