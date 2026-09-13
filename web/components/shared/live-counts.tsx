"use client";

/**
 * The entry screen's own numbers, read from this deployment at load time (GET /impact).
 *
 * Every figure here is counted in this database. Nothing is illustrative, and nothing is a
 * national projection: `docs/facts.md` governs a number on the entry screen exactly as it governs
 * one on a findings page. When the backend cannot be reached the block renders nothing rather
 * than showing zeros, which would read as "the system found nothing" instead of "not loaded".
 */
import type { JSX } from "react";
import { SimpleBarChart } from "@/components/shared/simple-bar-chart";
import { api } from "@/lib/api-client";
import { errorsByRule } from "@/lib/charts";
import { useResource } from "@/lib/use-resource";

function Figure({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <div className="px-5 py-4">
      <p className="font-heading text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Live counts plus the per-article chart, or nothing at all when there is no data to state. */
export function LiveCounts(): JSX.Element | null {
  const { data } = useResource("impact", (signal) => api.getImpact(undefined, signal));

  if (!data || data.documents === 0) return null;

  const byArticle = errorsByRule(data.by_rule);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-float">
      <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <Figure value={data.documents_analysed} label="Dossiers analysés" />
        <Figure value={data.findings_decided} label="Constats cités" />
        <Figure value={data.errors_intercepted} label="Erreurs interceptées" />
        <Figure value={data.facts_confirmed_by_people} label="Faits confirmés par une personne" />
      </dl>

      {byArticle.length > 0 && (
        <div className="border-t px-5 py-4">
          <h3 className="text-sm font-medium">Erreurs interceptées par article</h3>
          <SimpleBarChart data={byArticle} labelWidth={160} height={Math.max(120, byArticle.length * 36)} />
        </div>
      )}

      <p className="border-t px-5 py-3 text-xs text-muted-foreground">
        Chiffres comptés dans cette base de démonstration, jamais une projection nationale.
      </p>
    </div>
  );
}
