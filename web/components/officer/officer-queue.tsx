"use client";

/** The officer's work list: polls the queue, filters it, and announces newly arrived files. */
import { useRef, useState, type JSX } from "react";
import { InboxIcon, RefreshCwIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";
import { QUEUE_POLL_MS } from "@/lib/config";
import { countLabel, formatTime } from "@/lib/format";
import { filterQueue, newArrivals, type QueueFilter } from "@/lib/queue";
import { useResource } from "@/lib/use-resource";
import { QueueTable } from "./queue-table";

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "abstained", label: "Avec abstention" },
  { value: "decided", label: "Entièrement décidés" },
];

/** Queue screen with refresh indicator, filter tabs and the arrival announcement. */
export function OfficerQueue(): JSX.Element {
  const seenIds = useRef<Set<string> | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("all");

  const { data, error, isLoading, updatedAt, reload } = useResource(
    "officer-queue",
    async (signal) => {
      const items = await api.getOfficerQueue(signal);
      const ids = items.map((item) => item.document_id);
      // Arrivals are computed per poll, so each new file animates exactly once.
      const arrived = newArrivals(seenIds.current, ids);
      seenIds.current = new Set(ids);
      return { items, arrived };
    },
    QUEUE_POLL_MS,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace agent"
        title="Dossiers pré-qualifiés"
        description="Chaque dossier arrive avec ses constats cités, ses abstentions nommées et sa vérification RNE. Vous validez ou signalez sans repartir de zéro."
        actions={
          <>
            {updatedAt && (
              <span className="text-xs text-muted-foreground tabular-nums">
                Actualisé à {formatTime(updatedAt)}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={reload}>
              <RefreshCwIcon aria-hidden />
              Actualiser
            </Button>
          </>
        }
      />

      <p aria-live="polite" className="sr-only">
        {data && data.arrived.size > 0
          ? `${countLabel(data.arrived.size, "nouveau dossier", "nouveaux dossiers")} dans la file`
          : ""}
      </p>

      {isLoading ? (
        <LoadingBlock label="Chargement de la file" rows={5} />
      ) : !data ? (
        <ErrorNotice error={error} onRetry={reload} />
      ) : (
        <>
          {error !== undefined && <StaleNotice onRetry={reload} />}
          {data.items.length === 0 ? (
            <EmptyState
              icon={InboxIcon}
              title="Aucun dossier en attente"
              description="Les dossiers pré-qualifiés apparaîtront ici dès leur arrivée."
            />
          ) : (
            <Tabs value={filter} onValueChange={(value) => setFilter(value as QueueFilter)}>
              <TabsList>
                {FILTERS.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                    <span className="text-muted-foreground tabular-nums">
                      {filterQueue(data.items, value).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {FILTERS.map(({ value }) => {
                const items = filterQueue(data.items, value);
                return (
                  <TabsContent key={value} value={value} className="mt-2">
                    {items.length === 0 ? (
                      <EmptyState
                        icon={InboxIcon}
                        title="Aucun dossier dans cette vue"
                        description="Les autres onglets contiennent les dossiers en attente."
                      />
                    ) : (
                      <QueueTable items={items} arrived={data.arrived} />
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
