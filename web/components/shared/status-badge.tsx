/**
 * Badges for the three status meanings (docs/design.md section 2) and for neutral document status.
 * The tones are exported so every component colours status, and only status, the same way.
 */
import type { JSX } from "react";
import { CheckIcon, CircleCheckIcon, CircleHelpIcon, FlagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FindingStatus, OfficerAction } from "@/lib/api-types";
import { documentStatusLabel } from "@/lib/labels";

/** Tinted surface, border and text for each status token. */
export const STATUS_TONE = {
  decided: "border-status-decided/30 bg-status-decided/10 text-status-decided",
  abstained: "border-status-abstained/30 bg-status-abstained/10 text-status-abstained",
  flagged: "border-status-flagged/30 bg-status-flagged/10 text-status-flagged",
} as const;

/** "Décidé" or "Abstention". An abstention has its own tone and is never shown as an error. */
export function FindingStatusBadge({ status }: { status: FindingStatus }): JSX.Element {
  if (status === "decided") {
    return (
      <Badge variant="outline" className={STATUS_TONE.decided}>
        <CircleCheckIcon aria-hidden />
        Décidé
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={STATUS_TONE.abstained}>
      <CircleHelpIcon aria-hidden />
      Abstention
    </Badge>
  );
}

/** Only a flag carries a status colour; a validation is shown neutrally. */
export function OfficerActionBadge({ action }: { action: OfficerAction }): JSX.Element {
  if (action === "flagged") {
    return (
      <Badge variant="outline" className={STATUS_TONE.flagged}>
        <FlagIcon aria-hidden />
        Signalé
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <CheckIcon aria-hidden />
      Validé
    </Badge>
  );
}

/** The backend's document status, shown neutrally: it reports progress, not a judgement. */
export function DocumentStatusBadge({ status }: { status: string }): JSX.Element {
  return <Badge variant="secondary">{documentStatusLabel(status)}</Badge>;
}
