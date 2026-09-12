/**
 * The answer first: proposed code, what is still missing, extracted fields and the supplier
 * check, stated in four tiles above the evidence they summarise.
 */
import type { JSX, ReactNode } from "react";
import { cn } from "cn";
import type { CounterpartyCheck, Extraction, Finding } from "@/lib/api-types";
import { summarizeFindings } from "@/lib/findings";
import { countLabel } from "@/lib/format";

function Tile({ label, children, hint }: { label: string; children: ReactNode; hint?: string }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-semibold break-words">{children}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function rneTile(check: CounterpartyCheck | null): { value: string; hint?: string; muted: boolean } {
  if (!check) return { value: "Non vérifié", muted: true };
  return {
    value: check.registered ? "Inscrit" : "Non inscrit",
    hint: check.identifiers_match ? "Identifiants concordants" : "Identifiants non concordants",
    muted: false,
  };
}

interface ResultBannerProps {
  findings: Finding[];
  extractions: Extraction[];
  check: CounterpartyCheck | null;
}

/** Summary tiles once rules have run; a waiting line before that. */
export function ResultBanner({ findings, extractions, check }: ResultBannerProps): JSX.Element {
  if (findings.length === 0) {
    return (
      <div role="status" className="rounded-xl border bg-card px-5 py-4">
        <p className="text-sm font-medium">Analyse en cours</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {extractions.length > 0
            ? `${countLabel(extractions.length, "champ lu", "champs lus")} pour l’instant. Le résultat s’affichera ici dès l’évaluation des règles.`
            : "Lecture du document. Le résultat s’affichera ici dès l’évaluation des règles."}
        </p>
      </div>
    );
  }

  const summary = summarizeFindings(findings);
  const assisted = extractions.filter((extraction) => extraction.source === "assisted").length;
  const rne = rneTile(check);

  return (
    <section aria-labelledby="resultat" className="overflow-hidden rounded-xl border">
      <h2 id="resultat" className="sr-only">
        Résultat de l’analyse
      </h2>
      <dl className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
        <Tile label={summary.codes.length > 1 ? "Codes proposés" : "Code proposé"}>
          {summary.codes.length > 0 ? (
            <span className="font-mono">{summary.codes.join(", ")}</span>
          ) : (
            <span className="font-normal text-muted-foreground">Aucun</span>
          )}
        </Tile>
        <Tile label="À clarifier">
          {summary.abstained > 0 ? (
            <span className="text-status-abstained">
              {countLabel(summary.abstained, "information manquante", "informations manquantes")}
            </span>
          ) : (
            <span className="font-normal text-muted-foreground">Aucune</span>
          )}
        </Tile>
        <Tile label="Champs extraits" hint={countLabel(assisted, "assisté", "assistés")}>
          {extractions.length}
        </Tile>
        <Tile label="Fournisseur (RNE)" hint={rne.hint}>
          <span className={cn(rne.muted && "font-normal text-muted-foreground")}>{rne.value}</span>
        </Tile>
      </dl>
      {summary.abstained > 0 && (
        <p className="border-t bg-card px-5 py-3 text-sm text-muted-foreground">
          Le système s’abstient plutôt que de deviner : chaque information manquante est nommée dans
          les constats ci-dessous.
        </p>
      )}
    </section>
  );
}
