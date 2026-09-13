"use client";

/**
 * Verified-passage search over the legal corpus (J10): a Q&A backup outside the timed demo, not
 * a chat interface. A query returns passages, never an answer; the system does not draft one.
 */
import { useState, type FormEvent, type JSX } from "react";
import { SearchIcon } from "lucide-react";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { PageGuide } from "@/components/shared/page-guide";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { countLabel } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { PassageHitCard } from "./passage-hit-card";

export function LegalSearch(): JSX.Element {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, error, isLoading, reload } = useResource(submitted ? `corpus-search:${submitted}` : null, (signal) =>
    api.searchCorpus(submitted, signal),
  );

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setSubmitted(query.trim());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Textes juridiques"
        title="Recherche dans les textes vérifiés"
        description="Chaque résultat est un passage qu’une personne a comparé au texte officiel ; le système ne répond jamais à votre place, il retrouve le passage."
      />
      <PageGuide
        steps={[
          "Tapez un numéro d’article, un mot-clé ou une expression, puis lancez la recherche.",
          "Ouvrez un résultat pour lire le passage complet, ses voisins et la page officielle.",
          "Un passage qui n’apparaît pas n’a pas encore été vérifié : il n’est jamais affiché.",
        ]}
      />

      <form onSubmit={submit} className="flex gap-2">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Un article, un mot-clé, une expression…"
          aria-label="Rechercher un passage vérifié"
        />
        <Button type="submit" disabled={query.trim().length === 0}>
          <SearchIcon aria-hidden />
          Rechercher
        </Button>
      </form>

      {submitted === "" ? (
        <p className="text-sm text-muted-foreground">
          Tapez une recherche pour interroger les textes vérifiés du corpus.
        </p>
      ) : isLoading ? (
        <LoadingBlock label="Recherche en cours" rows={3} />
      ) : !data ? (
        <ErrorNotice error={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Aucun passage vérifié ne correspond"
          description="Essayez un autre mot, ou consultez le registre des règles pour les citations déjà vérifiées."
        />
      ) : (
        <div className="space-y-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {countLabel(data.length, "passage vérifié", "passages vérifiés")}
          </p>
          <ul className="space-y-3">
            {data.map((hit) => (
              <PassageHitCard key={hit.id} hit={hit} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
