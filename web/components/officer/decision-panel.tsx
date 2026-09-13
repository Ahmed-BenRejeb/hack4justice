"use client";

/**
 * The officer's one action on a file: validate or flag. The officer never edits the file
 * (docs/architecture.md section 2); a flag requires a reason the business can act on.
 */
import { useId, useRef, useState, type JSX } from "react";
import { CheckIcon, FlagIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { describeError } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import type { OfficerAction } from "@/lib/api-types";

interface DecisionPanelProps {
  documentId: string;
  officerId: string;
  onDecided: () => void;
}

/** Observation field plus the validate and flag buttons. */
export function DecisionPanel({ documentId, officerId, onDecided }: DecisionPanelProps): JSX.Element {
  const noteId = useId();
  const hintId = useId();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");
  const [noteMissing, setNoteMissing] = useState(false);
  const [pending, setPending] = useState<OfficerAction | null>(null);

  async function decide(action: OfficerAction): Promise<void> {
    const trimmed = note.trim();
    if (action === "flagged" && !trimmed) {
      setNoteMissing(true);
      noteRef.current?.focus();
      return;
    }
    setPending(action);
    try {
      await api.submitOfficerDecision({
        document_id: documentId,
        officer_id: officerId,
        action,
        note: trimmed || null,
      });
      toast.success(action === "validated" ? "Dossier validé" : "Dossier signalé");
      // Buttons stay disabled until the refreshed file replaces this panel, preventing a double submit.
      onDecided();
    } catch (error) {
      const { title, detail } = describeError(error);
      toast.error(title, { description: detail ?? undefined });
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Décision</CardTitle>
        <CardDescription>Le système pré-qualifie, vous décidez. Le dossier lui-même n’est pas modifiable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={noteId}>Observation</Label>
          <Textarea
            id={noteId}
            ref={noteRef}
            rows={3}
            value={note}
            placeholder="Motif du signalement ou remarque"
            aria-invalid={noteMissing || undefined}
            aria-describedby={hintId}
            onChange={(event) => {
              setNote(event.target.value);
              setNoteMissing(false);
            }}
          />
          <p id={hintId} className={cn("text-xs", noteMissing ? "text-destructive" : "text-muted-foreground")}>
            {noteMissing
              ? "Précisez le motif avant de signaler ce dossier."
              : "Facultative pour valider, obligatoire pour signaler."}
          </p>
        </div>
        <div className="grid gap-2">
          <Button size="lg" onClick={() => void decide("validated")} disabled={pending !== null}>
            <CheckIcon aria-hidden />
            {pending === "validated" ? "Validation…" : "Valider le dossier"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => void decide("flagged")}
            disabled={pending !== null}
            className="border-status-flagged/40 text-status-flagged hover:bg-status-flagged/10 hover:text-status-flagged"
          >
            <FlagIcon aria-hidden />
            {pending === "flagged" ? "Signalement…" : "Signaler"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
