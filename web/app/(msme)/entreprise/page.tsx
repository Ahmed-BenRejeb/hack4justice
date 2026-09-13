/** MSME entry: the dashboard of the organisations the signed-in user files for. */
import type { JSX } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { UploadIcon } from "lucide-react";
import { MsmeDashboard } from "@/components/msme/msme-dashboard";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Tableau de bord" };

/** Title with the upload action, the guide, then the organisation's figures. */
export default async function MsmeDashboardPage(): Promise<JSX.Element> {
  // The same memoised lookup the layout made, so this costs no second backend call.
  const user = await requireRole("msme", "accountant");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace entreprise"
        title="Tableau de bord"
        description="L’état de vos dossiers de paiement : ce qui a été déposé, ce qui attend un agent, et ce que Chahed a relevé avant la déclaration."
        actions={
          <Button asChild>
            <Link href="/entreprise/deposer">
              <UploadIcon aria-hidden />
              Déposer un dossier
            </Link>
          </Button>
        }
      />
      <PageGuide
        steps={[
          "Déposez un dossier de paiement : un PDF, un scan ou des photos prises au téléphone.",
          "Ouvrez le dossier pour lire le code de retenue proposé et l’article qui le fonde.",
          "Si une information manque, Chahed la nomme ; quand une question vous est posée, votre réponse relance l’analyse.",
          "Suivez ici les décisions de l’agent et les informations qui vous manquent le plus souvent.",
        ]}
      />
      <MsmeDashboard organisations={user.organisations} />
    </div>
  );
}
