/** One search or related-passage hit: excerpt with matched terms marked, reference, link to the reader (J2, J10). */
import type { JSX } from "react";
import Link from "next/link";
import { ScaleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PassageHit } from "@/lib/api-types";
import { matchLabel, splitExcerpt } from "@/lib/corpus";

export function PassageHitCard({ hit }: { hit: PassageHit }): JSX.Element {
  const segments = splitExcerpt(hit.excerpt);

  return (
    <li className="rounded-lg border bg-card">
      <Link href={`/textes/${hit.id}`} className="block space-y-2 rounded-lg p-4 hover:bg-muted/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <ScaleIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">
              {hit.article_ref}
              {hit.paragraph_ref && <span className="text-muted-foreground">, {hit.paragraph_ref}</span>}
            </span>
          </span>
          <Badge variant="outline" className="shrink-0">
            {matchLabel(hit.match)}
          </Badge>
        </div>
        <p lang="fr" className="text-sm leading-relaxed text-pretty">
          {segments.map((segment, index) =>
            segment.matched ? (
              <mark key={index} className="rounded-sm bg-accent px-0.5 text-accent-foreground">
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {hit.source_title} · {hit.source_edition}
        </p>
      </Link>
    </li>
  );
}
