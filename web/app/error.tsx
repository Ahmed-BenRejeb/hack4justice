"use client";

/** Fallback for unexpected rendering errors anywhere below the root layout. */
import type { JSX } from "react";
import { Button } from "@/components/ui/button";

/** Plain explanation with a retry; the error digest links the screen to server logs. It replaces the frame, so it is its own `<main>`. */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}): JSX.Element {
  return (
    <main id="contenu" tabIndex={-1} className="mx-auto max-w-xl px-4 py-24 text-center outline-none">
      <p className="text-sm font-medium text-muted-foreground">Erreur inattendue</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
        L’écran n’a pas pu s’afficher
      </h1>
      <p className="mt-2 text-muted-foreground">Réessayez. Si le problème persiste, communiquez la référence ci-dessous.</p>
      {error.digest && <p className="mt-4 font-mono text-xs text-muted-foreground">Référence : {error.digest}</p>}
      <Button className="mt-6" onClick={() => retry()}>
        Réessayer
      </Button>
    </main>
  );
}
