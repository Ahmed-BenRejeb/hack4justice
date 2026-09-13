"use client";

/**
 * The verified passage a citation points to: full text, its neighbours, its article's verified
 * outline, and the official source (J2). D-029: an unverified chunk answers 404 exactly like a
 * missing one, so this reads as the normal case today, not a system error (docs/frontend-plan.md
 * section 3.1) - almost every indexed chunk is still awaiting a person's verification.
 */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, ExternalLinkIcon, FileQuestionIcon } from "lucide-react";
import { cn } from "cn";
import { EmptyState, ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import type { Passage, PassageText } from "@/lib/api-types";
import { formatDate, httpUrl } from "@/lib/format";
import { usePassage } from "@/lib/use-passage";

function NeighbourLink({
  passage,
  direction,
}: {
  passage: PassageText | null;
  direction: "previous" | "next";
}): JSX.Element | null {
  if (!passage) return null;
  const label = passage.paragraph_ref || passage.article_ref;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/textes/${passage.id}`}>
        {direction === "previous" ? (
          <>
            <ArrowLeftIcon aria-hidden />
            <span className="max-w-48 truncate">{label}</span>
          </>
        ) : (
          <>
            <span className="max-w-48 truncate">{label}</span>
            <ArrowRightIcon aria-hidden />
          </>
        )}
      </Link>
    </Button>
  );
}

function ArticleOutline({ outline, currentId }: { outline: Passage[]; currentId: string }): JSX.Element | null {
  if (outline.length < 2) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        Passages vérifiés de {outline[0].article_ref}
      </h2>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {outline.map((item) => (
          <li key={item.id}>
            <Link
              href={`/textes/${item.id}`}
              aria-current={item.id === currentId ? "page" : undefined}
              className={cn(
                "block px-4 py-3 text-sm transition-colors hover:bg-muted/70",
                item.id === currentId && "bg-muted font-medium",
              )}
            >
              {item.paragraph_ref || item.article_ref}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Renders the passage at `chunkId`, or the calm "not yet verified" state D-029 requires for the common case. */
export function PassageReader({ chunkId }: { chunkId: string }): JSX.Element {
  const { data, error, isLoading, reload } = usePassage(chunkId);

  if (isLoading) return <LoadingBlock label="Chargement du passage" rows={4} />;

  if (!data) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          icon={FileQuestionIcon}
          title="Ce passage n’est pas encore vérifié"
          description="Le lecteur ne montre que les passages qu’une personne a comparés au texte officiel (D-029). Celui-ci n’y figure pas encore, ou l’identifiant est incorrect."
        />
      );
    }
    return <ErrorNotice error={error} onRetry={reload} />;
  }

  const { passage, previous, next, outline, source } = data;
  const href = httpUrl(passage.official_url);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={passage.paragraph_ref ? `${passage.article_ref}, ${passage.paragraph_ref}` : passage.article_ref}
        title={source.title}
        description={`${source.publisher} · ${source.edition}, page ${passage.page}`}
        meta={
          <Badge variant="outline">
            Vérifié par {passage.verified_by} le {formatDate(passage.verified_on)}
          </Badge>
        }
      />

      <div className="rounded-xl border bg-card p-6">
        <blockquote
          lang="fr"
          className="border-l-2 border-foreground/20 pl-4 text-base leading-relaxed whitespace-pre-line"
        >
          {passage.text}
        </blockquote>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Consulter la source officielle
            <ExternalLinkIcon className="size-3.5" aria-hidden />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">Lien vers la source officielle indisponible.</p>
        )}
      </div>

      {(previous || next) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <NeighbourLink passage={previous} direction="previous" />
          <NeighbourLink passage={next} direction="next" />
        </div>
      )}

      <ArticleOutline outline={outline} currentId={passage.id} />
    </div>
  );
}
