"use client";

/**
 * The administrator's dashboard: the size of the rule registry, the indexed sources and how much
 * of their text a person has verified (D-029, D-032). Counts and references only: no passage text
 * appears here, verified or not.
 */
import type { JSX } from "react";
import Link from "next/link";
import { BookOpenIcon, ClipboardCheckIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { ChartCard, StatGrid, StatTile } from "@/components/shared/dashboard";
import { Section } from "@/components/shared/section";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";

/** Loads the registry, the sources and the verification queue. */
export function AdminDashboard(): JSX.Element {
  const rules = useResource("rules", (signal) => api.listRules(signal));
  const sources = useResource("corpus-sources", (signal) => api.listCorpusSources(signal));
  const pending = useResource("corpus-verification-queue", (signal) => api.getVerificationQueue(signal));

  if (rules.isLoading || sources.isLoading || pending.isLoading) {
    return <LoadingBlock label="Chargement du tableau de bord" rows={4} />;
  }
  if (!rules.data || !sources.data || !pending.data) {
    const reload = (): void => {
      rules.reload();
      sources.reload();
      pending.reload();
    };
    return <ErrorNotice error={rules.error ?? sources.error ?? pending.error} onRetry={reload} />;
  }

  const verified = sources.data.reduce((sum, source) => sum + source.verified_passages, 0);
  const indexed = sources.data.reduce((sum, source) => sum + source.total_passages, 0);

  return (
    <div className="space-y-6">
      <StatGrid label="Chiffres clés">
        <StatTile label="Règles au registre" value={rules.data.length} hint="Chacune avec sa citation vérifiée" />
        <StatTile label="Sources indexées" value={sources.data.length} hint="Textes officiels chargés dans le corpus" />
        <StatTile label="Passages vérifiés" value={verified} hint={`Sur ${indexed} passages indexés`} />
        <StatTile label="Références à vérifier" value={pending.data.length} hint="À comparer au texte officiel" />
      </StatGrid>

      {sources.data.length > 0 && (
        <ChartCard
          title="Passages en attente de vérification, par source"
          description="Un passage non vérifié n’est jamais affiché ni cité, nulle part dans l’application."
        >
          <SimpleBarChart
            data={sources.data.map((source) => ({
              label: source.id,
              value: source.total_passages - source.verified_passages,
            }))}
            labelWidth={160}
            height={Math.max(140, sources.data.length * 40)}
          />
        </ChartCard>
      )}

      <Section
        id="sources"
        title="Sources indexées"
        description="La provenance de chaque texte, sa vérification et les règles qui le citent."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/corpus">
              <ClipboardCheckIcon aria-hidden />
              Ouvrir la vérification
            </Link>
          </Button>
        }
      >
        {sources.data.length === 0 ? (
          <EmptyState
            icon={BookOpenIcon}
            title="Aucune source indexée"
            description="Le corpus se charge au démarrage du service d’analyse, à partir des textes officiels du dépôt."
          />
        ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4">Source</TableHead>
                <TableHead className="text-right">Passages vérifiés</TableHead>
                <TableHead className="pr-4">Règles qui la citent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.data.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="px-4 py-2.5 whitespace-normal">
                    <span className="font-medium">{source.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {source.edition} · {source.publisher} · <span className="font-mono">{source.id}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {source.verified_passages} / {source.total_passages}
                  </TableCell>
                  <TableCell className="pr-4 font-mono text-xs whitespace-normal">
                    {source.citing_rules.length > 0 ? source.citing_rules.join(", ") : "Aucune"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </Section>
    </div>
  );
}
