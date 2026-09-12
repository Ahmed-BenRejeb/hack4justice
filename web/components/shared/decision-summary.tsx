/** The officer's decision on a file, or the fact that it is still awaiting one. */
import type { JSX } from "react";
import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OfficerDecision } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { OfficerActionBadge } from "./status-badge";

/** Decision badge, date and observation; a waiting note when no decision exists. */
export function DecisionSummary({ decision }: { decision: OfficerDecision | null }): JSX.Element {
  if (!decision) {
    return (
      <div className="rounded-xl border border-dashed bg-card px-5 py-4">
        <p className="text-sm font-medium">En attente d’examen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Un agent validera ou signalera ce dossier. Aucun export n’est produit avant sa validation.
        </p>
      </div>
    );
  }

  return (
    <Card className={cn(decision.action === "flagged" && "border-l-4 border-l-status-flagged")}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Décision de l’agent
          <OfficerActionBadge action={decision.action} />
        </CardTitle>
        <CardDescription>Le {formatDateTime(decision.decided_at)}</CardDescription>
      </CardHeader>
      {decision.note && (
        <CardContent>
          <p className="text-xs text-muted-foreground">Observation</p>
          <p className="mt-1 text-sm whitespace-pre-line">{decision.note}</p>
        </CardContent>
      )}
    </Card>
  );
}
