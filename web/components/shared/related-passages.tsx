"use client";

/**
 * Verified passages related to a finding's rule and missing fact, one click from its citation
 * (J2, J10). Renders nothing while loading, on error, or with no results: this is a supplementary
 * pointer into the corpus, not part of the finding itself, so it never competes with the citation
 * that actually grounds the finding, and never flashes into view only to disappear.
 */
import type { JSX } from "react";
import { ChevronDownIcon, LibraryIcon } from "lucide-react";
import { PassageHitCard } from "@/components/corpus/passage-hit-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRelatedPassages } from "@/lib/use-related-passages";

export function RelatedPassages({ findingId }: { findingId: string }): JSX.Element | null {
  const { data, isLoading } = useRelatedPassages(findingId);
  if (isLoading || !data || data.length === 0) return null;

  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/70">
        <LibraryIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 text-sm font-medium">Textes apparentés</span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="space-y-2 border-t p-4">
          {data.map((hit) => (
            <PassageHitCard key={hit.id} hit={hit} />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
