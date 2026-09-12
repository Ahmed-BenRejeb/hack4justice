"use client";

/**
 * RNE registration facts for the supplier, as a rail card. Facts only: no score, no rating
 * (D-007), and nothing inferred beyond what the registry states.
 */
import { useState, type JSX, type ReactNode } from "react";
import { Building2Icon, CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { CounterpartyCheck } from "@/lib/api-types";
import { describeError } from "./api-state";

function Fact({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
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
  /** When given, the card offers to run the check and calls this once it has run. */
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

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Fournisseur (RNE)</CardTitle>
        {!check && (
          <CardDescription>
            {onChecked
              ? "Vérifie l’existence du fournisseur au registre, ses identifiants et son statut."
              : "Pas encore vérifié au registre."}
          </CardDescription>
        )}
      </CardHeader>
      {check ? (
        <>
          <CardContent>
            <dl className="space-y-2.5 text-sm">
              <Fact label="Inscription">
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
              <Fact label="Statut">{check.status_text}</Fact>
            </dl>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Faits d’enregistrement uniquement, sans notation du fournisseur.
          </CardFooter>
        </>
      ) : (
        onChecked && (
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => void run()} disabled={isRunning}>
              <Building2Icon aria-hidden />
              {isRunning ? "Vérification en cours…" : "Vérifier au RNE"}
            </Button>
          </CardContent>
        )
      )}
    </Card>
  );
}
