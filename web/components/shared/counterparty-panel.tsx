"use client";

/**
 * RNE registration facts for the supplier. Facts only: no score, no rating (D-007), and
 * nothing inferred beyond what the registry states.
 */
import { useState, type JSX, type ReactNode } from "react";
import { Building2Icon, CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { CounterpartyCheck } from "@/lib/api-types";
import { describeError } from "./api-state";

function Fact({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  );
}

function YesNo({ value, yes, no }: { value: boolean; yes: string; no: string }): JSX.Element {
  const Icon = value ? CheckIcon : XIcon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-4" aria-hidden />
      {value ? yes : no}
    </span>
  );
}

interface CounterpartyPanelProps {
  documentId: string;
  check: CounterpartyCheck | null;
  /** When given, the panel offers to run the check and calls this once it has run. */
  onChecked?: () => void;
}

/** The check result, or an invitation to run it (MSME) or a plain "not checked" (officer). */
export function CounterpartyPanel({ documentId, check, onChecked }: CounterpartyPanelProps): JSX.Element {
  const [isRunning, setIsRunning] = useState(false);

  async function run(): Promise<void> {
    setIsRunning(true);
    try {
      await api.runCounterpartyCheck(documentId);
      toast.success("Vérification RNE effectuée");
      onChecked?.();
    } catch (error) {
      const { title, detail } = describeError(error);
      toast.error(title, { description: detail ?? undefined });
    } finally {
      setIsRunning(false);
    }
  }

  if (!check) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Aucune vérification effectuée</p>
          <p className="text-sm text-muted-foreground">
            {onChecked
              ? "Contrôle l’existence du fournisseur au registre, ses identifiants et son statut."
              : "Le fournisseur n’a pas encore été vérifié au RNE."}
          </p>
        </div>
        {onChecked && (
          <Button variant="outline" onClick={() => void run()} disabled={isRunning}>
            <Building2Icon aria-hidden />
            {isRunning ? "Vérification en cours…" : "Vérifier au RNE"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <dl className="grid gap-px bg-border sm:grid-cols-2">
        <Fact label="Inscription au RNE">
          <YesNo value={check.registered} yes="Inscrit" no="Non inscrit" />
        </Fact>
        <Fact label="Identifiants">
          <YesNo value={check.identifiers_match} yes="Concordants" no="Non concordants" />
        </Fact>
        <Fact label="Identifiant RNE">
          {check.rne_id ? (
            <span className="font-mono">{check.rne_id}</span>
          ) : (
            <span className="font-normal text-muted-foreground">Non communiqué</span>
          )}
        </Fact>
        <Fact label="Statut au registre">{check.status_text}</Fact>
      </dl>
      <p className="border-t bg-card px-5 py-3 text-xs text-muted-foreground">
        Faits d’enregistrement uniquement : aucune note ni appréciation du fournisseur. Ce que le
        registre ne dit pas n’est pas déduit.
      </p>
    </div>
  );
}
