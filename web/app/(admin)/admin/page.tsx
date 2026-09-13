/** Admin entry: the dashboard of the rule registry and the corpus verification. */
import type { JSX } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScaleIcon } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tableau de bord" };

/** Title with the registry action, the guide, then the figures. */
export default function AdminDashboardPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Tableau de bord"
        description="L’état du registre des règles et de la vérification des textes par des personnes."
        actions={
          <Button asChild>
            <Link href="/admin/regles">
              <ScaleIcon aria-hidden />
              Voir le registre
            </Link>
          </Button>
        }
      />
      <PageGuide
        steps={[
          "Suivez ici le nombre de règles au registre et la part des textes déjà vérifiée.",
          "Le registre des règles montre chaque règle avec la citation qui la fonde.",
          "La vérification du corpus liste les passages qu’une personne doit encore comparer au texte officiel.",
        ]}
      />
      <AdminDashboard />
    </div>
  );
}
