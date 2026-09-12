"use client";

/** Read-only view of the rule registry: every rule with its code, evaluating logic and citation. */
import { useState, type JSX } from "react";
import { BookOpenIcon, SearchIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { Citation } from "@/components/shared/citation";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import type { Rule } from "@/lib/api-types";
import { countLabel, foldText } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

function matches(rule: Rule, foldedQuery: string): boolean {
  return [rule.code, rule.article_ref, rule.citation_source, rule.logic_ref].some((value) =>
    foldText(value).includes(foldedQuery),
  );
}

/** Searchable list of rules; the search ignores case and accents. */
export function RuleRegistry(): JSX.Element {
  const [query, setQuery] = useState("");
  const { data, error, isLoading, reload } = useResource("rules", (signal) => api.listRules(signal));

  const foldedQuery = foldText(query.trim());
  const rules = data?.filter((rule) => matches(rule, foldedQuery)) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Registre des règles"
        description="Chaque règle porte la source, l’article, le texte intégral et le lien du texte qui la fonde. Une règle sans citation vérifiée n’entre pas au registre."
      />

      {isLoading ? (
        <LoadingBlock label="Chargement du registre" rows={4} />
      ) : !data ? (
        <ErrorNotice error={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="Le registre est vide"
          description="Aucune règle n’a encore été enregistrée avec sa citation."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Code, article, source…"
                aria-label="Rechercher une règle"
                className="pl-8"
              />
            </div>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {countLabel(rules.length, "règle", "règles")} · consultation seule
            </p>
          </div>

          {rules.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="Aucune règle ne correspond"
              description="Essayez un code, un numéro d’article ou le nom d’une source."
            />
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[15rem_minmax(0,1fr)] md:p-5"
                >
                  <dl className="space-y-2">
                    <div>
                      <dt className="sr-only">Code</dt>
                      <dd className="font-mono text-sm font-medium">{rule.code}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Logique d’évaluation</dt>
                      <dd className="font-mono text-xs break-words">{rule.logic_ref}</dd>
                    </div>
                  </dl>
                  <Citation rule={rule} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
