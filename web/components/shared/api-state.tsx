/** Loading, error, stale-data and empty states shared by every screen that talks to the backend. */
import type { JSX } from "react";
import { RefreshCwIcon, TriangleAlertIcon, type LucideIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";

/** French title and technical detail for any error thrown while calling the backend. */
export function describeError(error: unknown): { title: string; detail: string | null } {
  if (!(error instanceof ApiError)) {
    return { title: "Erreur inattendue", detail: error instanceof Error ? error.message : null };
  }
  switch (error.status) {
    case 0:
      return { title: "Connexion impossible", detail: "Le navigateur n’a pas pu joindre le serveur." };
    case 502:
      return {
        title: "Service d’analyse injoignable",
        detail: "Le serveur d’application ne parvient pas à joindre le service d’analyse.",
      };
    case 404:
      return { title: "Ressource introuvable", detail: error.message };
    case 409:
      return { title: "Action refusée", detail: error.message };
    case 422:
      return { title: "Données refusées", detail: error.message };
    default:
      return { title: `Erreur du serveur (${error.status})`, detail: error.message };
  }
}

/** Blocking error for a screen that has no data to show, with an optional retry. */
export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }): JSX.Element {
  const { title, detail } = describeError(error);
  // A refused export returns one message per schema error; each deserves its own line.
  const details = error instanceof ApiError && error.details.length > 1 ? error.details : null;
  return (
    <Alert variant="destructive">
      <TriangleAlertIcon aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {details ? (
          <ul className="list-disc space-y-1 pl-4 font-mono text-xs break-words">
            {details.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        ) : (
          detail && <p className="font-mono text-xs break-words">{detail}</p>
        )}
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/** Non-blocking notice that a refresh failed while earlier data stays on screen. */
export function StaleNotice({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-2.5 text-sm"
    >
      <span className="text-muted-foreground">
        La dernière actualisation a échoué. Les informations affichées peuvent être dépassées.
      </span>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        <RefreshCwIcon aria-hidden />
        Réessayer
      </Button>
    </div>
  );
}

/** Static placeholder blocks. No pulse: looping animation is forbidden (docs/design.md section 5). */
export function LoadingBlock({ label, rows = 3 }: { label: string; rows?: number }): JSX.Element {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Centered explanation for a list or region with nothing in it yet. */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
