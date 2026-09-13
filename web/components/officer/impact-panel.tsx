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
import type { JSX } from "react";
import { ActivityIcon } from "lucide-react";
import { ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { ChartCard, StatGrid, StatTile } from "@/components/shared/dashboard";
import { Section } from "@/components/shared/section";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { StatusBarChart } from "@/components/shared/status-bar-chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import type { Measurement } from "@/lib/api-types";
import { errorsByRule, missingFactChart } from "@/lib/charts";
import { countLabel } from "@/lib/format";
import { describeCalculation, INPUT_LABELS } from "@/lib/impact";
import { useResource } from "@/lib/use-resource";

/** The counted outcomes, per rule and per missing fact, then the derived benefit. */
function Measured({ measurement }: { measurement: Measurement }): JSX.Element {
  const calculation = describeCalculation(measurement);

  return (
    <div className="space-y-6">
      <StatGrid label="Mesures relevées">
        <StatTile label="Dossiers déposés" value={measurement.documents} />
        <StatTile label="Dossiers analysés" value={measurement.documents_analysed} />
        <StatTile
          label="Erreurs interceptées"
          value={<span className="text-status-decided">{measurement.errors_intercepted}</span>}
          hint="Constats dont la règle déclare qu’ils signalent un problème"
        />
        <StatTile
          label="Informations manquantes"
          value={<span className="text-status-abstained">{measurement.findings_abstained}</span>}
          hint={`${countLabel(measurement.facts_confirmed_by_people, "fait confirmé", "faits confirmés")} par une personne`}
        />
      </StatGrid>

      {(measurement.findings_decided > 0 || measurement.findings_abstained > 0) && (
        <ChartCard title="Décidés contre abstentions">
          <StatusBarChart decided={measurement.findings_decided} abstained={measurement.findings_abstained} />
        </ChartCard>
      )}

      {measurement.by_rule.length > 0 && (
        <ChartCard title="Erreurs interceptées par règle">
          <SimpleBarChart data={errorsByRule(measurement.by_rule)} labelWidth={160} />
        </ChartCard>
      )}

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
        <ChartCard title="Ce qui bloque le plus de dossiers">
          <SimpleBarChart
            data={missingFactChart(measurement.abstentions_by_missing_fact)}
            labelWidth={180}
            height={Math.max(140, measurement.abstentions_by_missing_fact.length * 36)}
          />
        </ChartCard>
      )}

      <ChartCard
        title="Bénéfice pour l’administration"
        description="Dérivé des erreurs interceptées ci-dessus, jamais présenté seul. La mesure principale reste les erreurs évitées, pas le temps gagné."
      >
        <p className="font-mono text-sm break-words">{calculation.formula}</p>
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
      </ChartCard>
    </div>
  );
}

/** Loads the measurement; a failure says so instead of showing an empty panel as if it were zero. */
export function ImpactPanel(): JSX.Element {
  const { data, error, isLoading, reload } = useResource("impact", (signal) => api.getImpact(undefined, signal));

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
