"use client";

/**
 * The officer's dashboard (F1): what waits in the queue and what blocks it, decisions and
 * schema-valid declarations, filings over the last days, then the files waiting longest. The
 * benefit calculation stays on the measures page, beside the counts it is derived from (D-016).
 */
import type { JSX } from "react";
import Link from "next/link";
import { InboxIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { ChartCard, StatGrid, StatTile } from "@/components/shared/dashboard";
import { Section } from "@/components/shared/section";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { StatusBarChart } from "@/components/shared/status-bar-chart";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { filingsByDay, missingFactChart } from "@/lib/charts";
import { countLabel } from "@/lib/format";
import { filterQueue } from "@/lib/queue";
import { useResource } from "@/lib/use-resource";
import { QueueTable } from "./queue-table";

const WAITING_SHOWN = 5;
// The dashboard does not poll, so nothing arrives here; the arrival moment belongs to the queue screen.
const NO_ARRIVALS: ReadonlySet<string> = new Set();

/** Loads the queue, the measurement and the activity, and shows nothing as zero while any is missing. */
export function OfficerDashboard(): JSX.Element {
  const queue = useResource("officer-queue", (signal) => api.getOfficerQueue(signal));
  const impact = useResource("impact", (signal) => api.getImpact(undefined, signal));
  const activity = useResource("activity", (signal) => api.getActivity(undefined, signal));

  if (queue.isLoading || impact.isLoading || activity.isLoading) {
    return <LoadingBlock label="Chargement du tableau de bord" rows={4} />;
  }
  if (!queue.data || !impact.data || !activity.data) {
    const reload = (): void => {
      queue.reload();
      impact.reload();
      activity.reload();
    };
    return <ErrorNotice error={queue.error ?? impact.error ?? activity.error} onRetry={reload} />;
  }

  const items = queue.data;
  const measurement = impact.data;
  const byStatus = activity.data.documents_by_status;
  const hasFindings = measurement.findings_decided > 0 || measurement.findings_abstained > 0;

  return (
    <div className="space-y-6">
      <StatGrid label="Chiffres clés">
        <StatTile
          label="Dossiers en attente"
          value={items.length}
          hint={`${filterQueue(items, "abstained").length} avec abstention`}
        />
        <StatTile
          label="Dossiers validés"
          value={byStatus.validated ?? 0}
          hint={countLabel(byStatus.flagged ?? 0, "dossier signalé", "dossiers signalés")}
        />
        <StatTile
          label="Déclarations TEJ produites"
          value={activity.data.documents_exported}
          hint="Validées contre le schéma publié par la DGI"
        />
        <StatTile
          label="Erreurs interceptées"
          value={measurement.errors_intercepted}
          hint="Constats dont la règle déclare qu’ils signalent un problème"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={`Dépôts sur les ${activity.data.documents_by_day.length} derniers jours`}
          description="Dossiers déposés par jour, heure de Tunis."
        >
          {activity.data.documents_by_day.some((entry) => entry.count > 0) ? (
            <SimpleBarChart data={filingsByDay(activity.data.documents_by_day)} columns height={200} />
          ) : (
            <p className="text-sm text-muted-foreground">Aucun dépôt sur cette période.</p>
          )}
        </ChartCard>
        <ChartCard
          title="Constats décidés et abstentions"
          description="Sur l’ensemble des dossiers analysés de ce jeu de démonstration."
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
          title="Ce qui bloque le plus de dossiers"
          description="Les informations manquantes les plus fréquentes, à demander en priorité."
        >
          <SimpleBarChart
            data={missingFactChart(measurement.abstentions_by_missing_fact)}
            labelWidth={180}
            height={Math.max(140, measurement.abstentions_by_missing_fact.length * 36)}
          />
        </ChartCard>
      )}

      <Section
        id="en-attente"
        title="Dossiers qui attendent depuis le plus longtemps"
        description="Cliquez sur une ligne pour ouvrir le dossier."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/agent/dossiers">
              <InboxIcon aria-hidden />
              Ouvrir la file
            </Link>
          </Button>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="Aucun dossier en attente"
            description="Les dossiers pré-qualifiés apparaîtront dans la file dès leur arrivée."
          />
        ) : (
          <QueueTable items={items.slice(0, WAITING_SHOWN)} arrived={NO_ARRIVALS} />
        )}
      </Section>
    </div>
  );
}
