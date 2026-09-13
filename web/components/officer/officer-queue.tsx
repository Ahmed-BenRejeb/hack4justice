"use client";

/** The officer's work list: polls the queue, filters it, and announces newly arrived files. */
import { useRef, useState, type JSX } from "react";
import { InboxIcon, RefreshCwIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";
import { QUEUE_POLL_MS } from "@/lib/config";
import { countLabel, formatTime } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { filterQueue, newArrivals, queueMissingFacts, withMissingFact, type QueueFilter } from "@/lib/queue";
import { useResource } from "@/lib/use-resource";
import { QueueTable } from "./queue-table";

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "abstained", label: "Avec abstention" },
  { value: "decided", label: "Entièrement décidés" },
];

interface MissingFactFilterProps {
  facts: string[];
  value: string;
  onChange: (fact: string) => void;
}

/** Narrows the queue to files missing one fact (J8); absent while no file abstains. */
function MissingFactFilter({ facts, value, onChange }: MissingFactFilterProps): JSX.Element | null {
  if (facts.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="missing-fact-filter" className="shrink-0 text-xs text-muted-foreground">
        Information manquante
      </Label>
      <NativeSelect
        id="missing-fact-filter"
        className="w-auto max-w-72"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Toutes</option>
        {facts.map((fact) => (
          <option key={fact} value={fact}>
            {fieldLabel(fact)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

/** Queue screen with refresh indicator, filter tabs, the missing-fact filter and the arrival announcement. */
export function OfficerQueue(): JSX.Element {
  const seenIds = useRef<Set<string> | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [missingFact, setMissingFact] = useState("");

  const { data, error, isLoading, updatedAt, reload } = useResource(
    "officer-queue",
    async (signal) => {
      const items = await api.getOfficerQueue(signal);
      const ids = items.map((item) => item.id);
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
        description="Chaque dossier arrive déjà lu et analysé : constats cités et abstentions nommées."
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
      <PageGuide
        steps={[
          "La file s’actualise d’elle-même : un nouveau dossier y apparaît sans recharger la page.",
          "Filtrez par onglet, ou par information manquante pour traiter ensemble les dossiers bloqués par la même question.",
          "Cliquez sur une ligne pour ouvrir le dossier, lire ses constats et leurs citations.",
          "Validez ou signalez le dossier ; il quitte alors la file.",
        ]}
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
              <div className="flex flex-wrap items-end justify-between gap-3">
                <TabsList>
                  {FILTERS.map(({ value, label }) => (
                    <TabsTrigger key={value} value={value}>
                      {label}
                      <span className="text-muted-foreground tabular-nums">
                        {filterQueue(withMissingFact(data.items, missingFact), value).length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <MissingFactFilter
                  // The selected fact stays listed after the last file naming it leaves the queue.
                  facts={queueMissingFacts(missingFact ? [...data.items, { missing_facts: [missingFact] }] : data.items)}
                  value={missingFact}
                  onChange={setMissingFact}
                />
              </div>
              {FILTERS.map(({ value }) => {
                const items = filterQueue(withMissingFact(data.items, missingFact), value);
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
