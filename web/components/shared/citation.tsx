"use client";

/**
 * The legal ground of a rule: the reference is always visible, and one click (or Enter) opens
 * the verbatim article text and its official source. This click is the product's argument
 * (docs/plan.md section 4), so it stays a single, obvious, keyboard-reachable control.
 */
import type { JSX } from "react";
import { ChevronDownIcon, ExternalLinkIcon, ScaleIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Rule } from "@/lib/api-types";
import { httpUrl } from "@/lib/format";

/** Collapsible citation: article reference and source, expanding to verbatim text and link. */
export function Citation({ rule }: { rule: Rule }): JSX.Element {
  const href = httpUrl(rule.url);

  return (
    <Collapsible className="rounded-lg border bg-muted/40">
      <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/70">
        <ScaleIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{rule.article_ref}</span>
          <span className="block truncate text-xs text-muted-foreground">{rule.citation_source}</span>
        </span>
        <span className="text-xs font-medium text-primary group-data-[state=open]:hidden">
          Lire l’article
        </span>
        <span className="hidden text-xs font-medium text-primary group-data-[state=open]:inline">
          Masquer
        </span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="space-y-3 border-t px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground">Texte intégral</p>
          <blockquote
            lang="fr"
            className="border-l-2 border-foreground/20 pl-4 text-sm leading-relaxed whitespace-pre-line"
          >
            {rule.verbatim_text}
          </blockquote>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Consulter la source officielle
              <ExternalLinkIcon className="size-3.5" aria-hidden />
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">Lien vers la source officielle indisponible.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
