/** Shown for any route that does not exist. */
import type { JSX } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Plain explanation and a way back home. */
export default function NotFound(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">Erreur 404</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Page introuvable</h1>
      <p className="mt-2 text-muted-foreground">L’adresse demandée ne correspond à aucune page.</p>
      <Button asChild className="mt-6">
        <Link href="/">Retour à l’accueil</Link>
      </Button>
    </div>
  );
}
