/** The officer's recorded decision on a file, as a rail card. */
import type { JSX } from "react";
import { cn } from "cn";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OfficerDecision } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { OfficerActionBadge } from "./status-badge";

/** Decision badge, date and observation. A flag also marks the card edge with its status colour. */
export function DecisionSummary({ decision }: { decision: OfficerDecision }): JSX.Element {
  return (
    <Card size="sm" className={cn(decision.action === "flagged" && "border-l-4 border-l-status-flagged")}>
      <CardHeader>
        <CardTitle>Décision de l’agent</CardTitle>
        <CardDescription>Le {formatDateTime(decision.decided_at)}</CardDescription>
        <CardAction>
          <OfficerActionBadge action={decision.action} />
        </CardAction>
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
