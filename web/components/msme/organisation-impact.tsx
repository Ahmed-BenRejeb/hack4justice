"use client";

/**
 * An organisation's own numbers (J9, F1, MSME side): its files, the errors this deployment
 * caught before filing, and which facts it keeps failing to supply, the one actionable chart on
 * this side. No benefit calculation: the hours figure is an argument made to the administration
 * (docs/decision-log.md D-016), never to the business.
 */
import { useId, useState, type JSX } from "react";
import { ActivityIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { Section } from "@/components/shared/section";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { Organisation } from "@/lib/api-types";
import { missingFactChart } from "@/lib/charts";
import { useOrganisationImpact } from "@/lib/use-impact";

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * A picker when the signed-in user files for several organisations (an accountant), then the
 * chosen organisation's own counts and missing-fact chart. The backend refuses any other organisation.
 */
export function OrganisationImpact({ organisations }: { organisations: Organisation[] }): JSX.Element {
  const selectId = useId();
  // An MSME user files for exactly one organisation, so there is nothing to choose.
  const [organisationId, setOrganisationId] = useState(organisations.length === 1 ? organisations[0].id : "");
  const impact = useOrganisationImpact(organisationId);

  return (
    <Section
      id="mes-chiffres"
      title="Mes chiffres"
      description="Ce que Chahed a relevé sur les dossiers déposés pour une organisation."
    >
      {organisations.length > 1 && (
        <div className="max-w-sm space-y-2">
          <Label htmlFor={selectId}>Organisation</Label>
          <NativeSelect id={selectId} value={organisationId} onChange={(event) => setOrganisationId(event.target.value)}>
            <option value="">Choisissez une organisation</option>
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>
                {organisation.name} ({organisation.tax_id})
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      {organisationId === "" ? (
        <p className="text-sm text-muted-foreground">Choisissez une organisation pour voir ses chiffres.</p>
      ) : impact.isLoading ? (
        <LoadingBlock label="Chargement des chiffres" rows={2} />
      ) : !impact.data ? (
        <ErrorNotice error={impact.error} onRetry={impact.reload} />
      ) : impact.data.documents === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="Aucun dossier pour cette organisation"
          description="Déposez un premier dossier pour voir ses chiffres apparaître ici."
        />
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Dossiers déposés" value={impact.data.documents} />
            <Tile label="Dossiers analysés" value={impact.data.documents_analysed} />
            <Tile label="Décidés" value={impact.data.findings_decided} />
            <Tile
              label="Erreurs interceptées avant dépôt"
              value={impact.data.errors_intercepted}
              hint="Constats dont la règle déclare qu’ils signalent un problème"
            />
          </dl>

          {impact.data.abstentions_by_missing_fact.length > 0 && (
            <div className="rounded-xl border bg-card px-5 py-4">
              <h3 className="text-sm font-medium">Ce qui vous manque le plus souvent</h3>
              <SimpleBarChart
                data={missingFactChart(impact.data.abstentions_by_missing_fact)}
                labelWidth={180}
                height={Math.max(140, impact.data.abstentions_by_missing_fact.length * 36)}
              />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
