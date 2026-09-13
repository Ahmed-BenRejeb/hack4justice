"use client";

/**
 * What the corpus actually holds, above the search box (J10): passages indexed per official
 * source, and how many of them a person has verified.
 *
 * The verified count is the honest headline here, not a footnote: search only ever returns
 * verified passages (D-029), so a reader who does not know the ratio cannot tell an empty result
 * from an unindexed one.
 */
import type { JSX } from "react";
import { LibraryIcon } from "lucide-react";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { api } from "@/lib/api-client";
import { corpusCoverage, corpusVerified } from "@/lib/charts";
import { countLabel } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

function Tile({ label, value, hint }: { label: string; value: number; hint?: string }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading mt-1 text-2xl font-bold tabular-nums">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Renders nothing while loading, on error, or with no indexed source, so it never flashes in. */
export function CorpusOverview(): JSX.Element | null {
  const { data } = useResource("corpus-sources", (signal) => api.listCorpusSources(signal));

  if (!data || data.length === 0) return null;

  const { verified, total } = corpusVerified(data);
  const coverage = corpusCoverage(data);

  return (
    <section aria-labelledby="corpus-etat" className="space-y-4">
      <h2 id="corpus-etat" className="sr-only">
        État du corpus
      </h2>

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border shadow-card sm:grid-cols-3">
        <Tile label="Sources officielles indexées" value={data.length} />
        <Tile label="Passages indexés" value={total} />
        <Tile
          label="Passages vérifiés"
          value={verified}
          hint="Seuls ceux-ci peuvent être cités ou trouvés par la recherche"
        />
      </dl>

      {coverage.length > 1 && (
        <div className="rounded-xl border bg-card px-5 py-4 shadow-card">
          <h3 className="text-sm font-medium">Passages indexés par source</h3>
          <SimpleBarChart data={coverage} labelWidth={200} height={Math.max(120, coverage.length * 36)} />
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <LibraryIcon className="size-4 shrink-0" aria-hidden />
        {countLabel(verified, "passage vérifié", "passages vérifiés")} sur {total} indexés : la
        vérification par une personne est en cours, et un passage non vérifié n’apparaît jamais.
      </p>
    </section>
  );
}
