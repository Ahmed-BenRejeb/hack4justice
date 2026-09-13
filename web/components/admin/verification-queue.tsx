"use client";

/** References only, never text: what still needs a person to check it against the official page (D-032). */
import type { JSX } from "react";
import { ClipboardCheckIcon, ExternalLinkIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { PageHeader } from "@/components/shared/page-header";
import { api } from "@/lib/api-client";
import { countLabel, httpUrl } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

/** Read-only list of unverified corpus chunks, one row per reference to check. */
export function VerificationQueue(): JSX.Element {
  const { data, error, isLoading, reload } = useResource("corpus-verification-queue", (signal) =>
    api.getVerificationQueue(signal),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vérification du corpus"
        description="Chaque référence doit être comparée au texte officiel par une personne avant qu’un passage puisse être cité ou trouvé (D-029, D-032). Le système ne montre jamais un texte non vérifié, ici ou ailleurs."
      />

      {isLoading ? (
        <LoadingBlock label="Chargement de la file de vérification" rows={3} />
      ) : !data ? (
        <ErrorNotice error={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={ClipboardCheckIcon}
          title="Tout le corpus indexé est vérifié"
          description="Aucune référence n’attend une comparaison avec le texte officiel."
        />
      ) : (
        <>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {countLabel(data.length, "référence en attente", "références en attente")}
          </p>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {data.map((entry) => {
              const href = httpUrl(entry.official_url);
              return (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {entry.article_ref}
                      {entry.paragraph_ref && <span className="text-muted-foreground">, {entry.paragraph_ref}</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.source_id} · page {entry.page}
                    </p>
                  </div>
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Vérifier sur la source
                      <ExternalLinkIcon className="size-3.5" aria-hidden />
                      <span className="sr-only">(nouvel onglet)</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
