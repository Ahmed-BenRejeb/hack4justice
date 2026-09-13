"use client";

/**
 * An organisation's dashboard (F1, MSME side): its files by status, its filings over the last
 * days, the errors caught before filing, what it keeps failing to supply, and its latest files.
 * No benefit calculation: the hours figure is an argument made to the administration (D-016),
 * never to the business.
 */
import { useId, useState, type JSX } from "react";
import Link from "next/link";
import { FileTextIcon, UploadIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { ChartCard, StatGrid, StatTile } from "@/components/shared/dashboard";
import { RecentDocuments } from "@/components/shared/recent-documents";
import { Section } from "@/components/shared/section";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { StatusBarChart } from "@/components/shared/status-bar-chart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/api-client";
import type { Activity, Measurement, Organisation } from "@/lib/api-types";
import { filingsByDay, missingFactChart } from "@/lib/charts";
import { countLabel } from "@/lib/format";
import { useOrganisationImpact } from "@/lib/use-impact";
import { useResource } from "@/lib/use-resource";

/** Key figures, the two charts, the missing facts and the latest files of one organisation. */
function Overview({ measurement, activity }: { measurement: Measurement; activity: Activity }): JSX.Element {
  const byStatus = activity.documents_by_status;
  const hasFindings = measurement.findings_decided > 0 || measurement.findings_abstained > 0;

  return (
    <div className="space-y-6">
      <StatGrid label="Chiffres clés">
        <StatTile
          label="Dossiers déposés"
          value={measurement.documents}
          hint={countLabel(measurement.documents_analysed, "dossier analysé", "dossiers analysés")}
        />
        <StatTile label="En attente d’examen" value={byStatus.extracted ?? 0} hint="Lus, en attente d’un agent" />
        <StatTile
          label="Validés par un agent"
          value={byStatus.validated ?? 0}
          hint={countLabel(byStatus.flagged ?? 0, "dossier signalé", "dossiers signalés")}
        />
        <StatTile
          label="Erreurs interceptées avant dépôt"
          value={measurement.errors_intercepted}
          hint="Constats dont la règle déclare qu’ils signalent un problème"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={`Dépôts sur les ${activity.documents_by_day.length} derniers jours`}
          description="Dossiers déposés par jour, heure de Tunis."
        >
          {activity.documents_by_day.some((entry) => entry.count > 0) ? (
            <SimpleBarChart data={filingsByDay(activity.documents_by_day)} columns height={200} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucun dépôt sur cette période.</p>
          )}
        </ChartCard>
        <ChartCard
          title="Constats décidés et abstentions"
          description="Une abstention nomme une information manquante ; ce n’est pas une erreur."
        >
          {hasFindings ? (
            <StatusBarChart decided={measurement.findings_decided} abstained={measurement.findings_abstained} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucun constat pour l’instant.</p>
          )}
        </ChartCard>
      </div>

      {measurement.abstentions_by_missing_fact.length > 0 && (
        <ChartCard
          title="Ce qui vous manque le plus souvent"
          description="Joindre ces informations au dossier dès le dépôt évite une abstention."
        >
          <SimpleBarChart
            data={missingFactChart(measurement.abstentions_by_missing_fact)}
            labelWidth={180}
            height={Math.max(140, measurement.abstentions_by_missing_fact.length * 36)}
          />
        </ChartCard>
      )}

      <Section
        id="derniers-dossiers"
        title="Derniers dossiers"
        description="Cliquez sur une ligne pour lire les constats et suivre la décision de l’agent."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/entreprise/deposer">
              <UploadIcon aria-hidden />
              Déposer un dossier
            </Link>
          </Button>
        }
      >
        <RecentDocuments documents={activity.recent_documents} basePath="/entreprise/dossiers" />
      </Section>
    </div>
  );
}

/** A picker when the user files for several organisations (an accountant), then the chosen one's dashboard. */
export function MsmeDashboard({ organisations }: { organisations: Organisation[] }): JSX.Element {
  const selectId = useId();
  // The first organisation shows at once; an accountant switches with the picker. The backend refuses any other.
  const [organisationId, setOrganisationId] = useState(organisations[0]?.id ?? "");
  const impact = useOrganisationImpact(organisationId);
  const activity = useResource(organisationId ? `activity:${organisationId}` : null, (signal) =>
    api.getActivity(organisationId, signal),
  );

  function reload(): void {
    impact.reload();
    activity.reload();
  }

  return (
    <div className="space-y-6">
      {organisations.length > 1 && (
        <div className="max-w-sm space-y-2">
          <Label htmlFor={selectId}>Organisation</Label>
          <NativeSelect id={selectId} value={organisationId} onChange={(event) => setOrganisationId(event.target.value)}>
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>
                {organisation.name} ({organisation.tax_id})
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      {organisationId === "" ? (
        <EmptyState
          icon={FileTextIcon}
          title="Aucune organisation rattachée"
          description="Votre compte ne dépose pour aucune organisation. Adressez-vous à l’administrateur."
        />
      ) : impact.isLoading || activity.isLoading ? (
        <LoadingBlock label="Chargement du tableau de bord" rows={3} />
      ) : !impact.data || !activity.data ? (
        <ErrorNotice error={impact.error ?? activity.error} onRetry={reload} />
      ) : impact.data.documents === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="Aucun dossier pour cette organisation"
          description="Déposez un premier dossier : ses chiffres apparaîtront ici dès son analyse."
        />
      ) : (
        <Overview measurement={impact.data} activity={activity.data} />
      )}
    </div>
  );
}
