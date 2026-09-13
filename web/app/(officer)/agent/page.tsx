/** Officer entry: the dashboard of the queue, decisions and declarations. */
import type { JSX } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { InboxIcon } from "lucide-react";
import { OfficerDashboard } from "@/components/officer/officer-dashboard";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tableau de bord" };

/** Title with the queue action, the guide, then the figures. */
export default function OfficerDashboardPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace agent"
        title="Tableau de bord"
        description="Ce qui attend votre examen, ce qui bloque les dossiers, et les déclarations déjà produites."
        actions={
          <Button asChild>
            <Link href="/agent/dossiers">
              <InboxIcon aria-hidden />
              Ouvrir la file
            </Link>
          </Button>
        }
      />
      <PageGuide
        steps={[
          "Repérez ici le nombre de dossiers en attente et les informations qui les bloquent.",
          "Ouvrez la file : chaque dossier arrive déjà lu, avec ses constats cités et ses abstentions nommées.",
          "Validez ou signalez chaque dossier ; seul un dossier validé peut être déclaré.",
          "Produisez la déclaration TEJ, contrôlée contre le schéma publié par la DGI avant d’être enregistrée.",
        ]}
      />
      <OfficerDashboard />
    </div>
  );
}
