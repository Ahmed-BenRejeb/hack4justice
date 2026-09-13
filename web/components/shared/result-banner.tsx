/** The answer first: proposed code and what is still missing, stated above the evidence they summarise. */
import type { JSX, ReactNode } from "react";
import type { Finding } from "@/lib/api-types";
import { summarizeFindings } from "@/lib/findings";
import { countLabel } from "@/lib/format";

function Tile({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-semibold break-words">{children}</dd>
    </div>
  );
}

/** Summary tiles when rules produced findings; a plain statement when none applied. */
export function ResultBanner({ findings }: { findings: Finding[] }): JSX.Element {
  if (findings.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-5 py-4">
        <p className="text-sm font-medium">Aucun constat établi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aucune règle du registre n’a été appliquée à ce dossier. Sans règle dont la citation est
          vérifiée, le système ne propose aucun code.
        </p>
      </div>
    );
  }

  const summary = summarizeFindings(findings);

  return (
    <section aria-labelledby="resultat" className="overflow-hidden rounded-xl border">
      <h2 id="resultat" className="sr-only">
        Résultat de l’analyse
      </h2>
      <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
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
        <Tile label="Règles appliquées">{findings.length}</Tile>
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
