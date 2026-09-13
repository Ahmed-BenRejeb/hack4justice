"use client";

/**
 * What the pipeline measured on its own data (J9, F1), and the benefit calculation derived from
 * it (D-016).
 *
 * Two kinds of number, never mixed and never presented alike: counts computed from this
 * deployment's database, stated with the dataset they describe, and the calculation's inputs,
 * each shown with its basis so an unsourced one reads as an estimate (docs/facts.md). No national
 * figure appears: its multiplicands are neither observed here nor verified.
 */
import type { JSX, ReactNode } from "react";
import { ActivityIcon } from "lucide-react";
import { ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import type { Measurement } from "@/lib/api-types";
import { countLabel } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { describeCalculation, INPUT_LABELS } from "@/lib/impact";
import { useResource } from "@/lib/use-resource";

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** The counted outcomes, per rule and per missing fact, then the derived benefit. */
function Measured({ measurement }: { measurement: Measurement }): JSX.Element {
  const calculation = describeCalculation(measurement);

  return (
    <div className="space-y-6">
      <section aria-labelledby="mesures" className="overflow-hidden rounded-xl border">
        <h3 id="mesures" className="sr-only">
          Mesures relevées
        </h3>
        <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Dossiers déposés" value={measurement.documents} />
          <Tile label="Dossiers analysés" value={measurement.documents_analysed} />
          <Tile
            label="Erreurs interceptées"
            value={<span className="text-status-decided">{measurement.errors_intercepted}</span>}
            hint="Constats dont la règle déclare qu’ils signalent un problème"
          />
          <Tile
            label="Informations manquantes"
            value={<span className="text-status-abstained">{measurement.findings_abstained}</span>}
            hint={`${countLabel(measurement.facts_confirmed_by_people, "fait confirmé", "faits confirmés")} par une personne`}
          />
        </dl>
      </section>

      {measurement.by_rule.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4">Règle</TableHead>
                <TableHead className="text-right">Décidés</TableHead>
                <TableHead className="text-right">Abstentions</TableHead>
                <TableHead className="pr-4 text-right">Erreurs interceptées</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurement.by_rule.map((row) => (
                <TableRow key={row.rule_code}>
                  <TableCell className="px-4 py-2.5 align-top whitespace-normal">
                    <span className="font-mono text-xs">{row.rule_code}</span>
                    <span className="block text-xs text-muted-foreground">{row.article_ref}</span>
                  </TableCell>
                  <TableCell className="py-2.5 text-right align-top tabular-nums">{row.decided}</TableCell>
                  <TableCell className="py-2.5 text-right align-top tabular-nums">{row.abstained}</TableCell>
                  <TableCell className="py-2.5 pr-4 text-right align-top font-medium tabular-nums">
                    {row.errors_intercepted}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {measurement.abstentions_by_missing_fact.length > 0 && (
        <div className="rounded-xl border bg-card px-5 py-4">
          <h3 className="text-sm font-medium">Ce qui bloque le plus de dossiers</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {measurement.abstentions_by_missing_fact.map((entry) => (
              <li key={entry.fact_name} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 break-words">{fieldLabel(entry.fact_name)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{entry.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border bg-card px-5 py-4">
        <h3 className="text-sm font-medium">Bénéfice pour l’administration</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Dérivé des erreurs interceptées ci-dessus, jamais présenté seul. La mesure principale
          reste les erreurs évitées, pas le temps gagné.
        </p>
        <p className="mt-3 font-mono text-sm break-words">{calculation.formula}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{calculation.hours}</p>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {measurement.inputs.map((input) => (
            <li key={input.name} className="flex flex-wrap items-center gap-2">
              <span>
                {INPUT_LABELS[input.name] ?? input.name} : <span className="tabular-nums">{input.value}</span>
              </span>
              {input.basis === "estimate" && (
                <Badge variant="outline" className="text-[10px]">
                  estimation
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Loads the measurement; a failure says so instead of showing an empty panel as if it were zero. */
export function ImpactPanel(): JSX.Element {
  const { data, error, isLoading, reload } = useResource("impact", (signal) => api.getImpact(signal));

  if (isLoading) return <LoadingBlock label="Chargement des mesures" rows={3} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  return (
    <Section
      id="impact"
      title="Mesures du jeu de démonstration"
      description="Chiffres comptés dans cette base, pour ce jeu de démonstration. Aucune projection nationale n’est affichée."
    >
      {error !== undefined && <StaleNotice onRetry={reload} />}
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <ActivityIcon className="size-4" aria-hidden />
        Jeu de démonstration, pas des données de production.
      </div>
      <Measured measurement={data} />
    </Section>
  );
}
