/** Structured fields read from a document, with where each value came from and its confidence. */
import type { JSX } from "react";
import { FileSearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Extraction, ExtractionSource } from "@/lib/api-types";
import { formatConfidence } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { EmptyState } from "./api-state";

function SourceBadge({ source }: { source: ExtractionSource }): JSX.Element {
  if (source === "extracted") {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Lu sur le document
      </Badge>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" tabIndex={0} className="cursor-help">
          Assisté
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Fait absent du document, fourni par le modèle avec un indice de confiance. La règle décide à
        partir de ce fait ; le modèle ne décide jamais.
      </TooltipContent>
    </Tooltip>
  );
}

interface ExtractionTableProps {
  extractions: Extraction[];
  /** True while the pipeline has not yet produced findings, so more fields may still arrive. */
  inProgress: boolean;
}

/**
 * Rows fade in as the backend produces them: the motion answers the user's upload
 * (docs/design.md section 5) and settles in a quarter second.
 */
export function ExtractionTable({ extractions, inProgress }: ExtractionTableProps): JSX.Element {
  if (extractions.length === 0) {
    if (!inProgress) {
      return (
        <EmptyState
          icon={FileSearchIcon}
          title="Aucun champ extrait"
          description="Le document n’a livré aucun champ structuré."
        />
      );
    }
    return (
      <div role="status" className="space-y-3 rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Lecture du document en cours. Les champs apparaîtront ici au fur et à mesure.
        </p>
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-4">Champ</TableHead>
            <TableHead>Valeur</TableHead>
            <TableHead>Origine</TableHead>
            <TableHead className="pr-4 text-right">Confiance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extractions.map((extraction) => (
            <TableRow key={extraction.id} className="animate-field-in">
              <TableCell className="px-4 py-3 align-top whitespace-normal text-muted-foreground">
                {fieldLabel(extraction.field_name)}
              </TableCell>
              <TableCell className="py-3 align-top font-medium break-words whitespace-normal">
                {extraction.value}
              </TableCell>
              <TableCell className="py-3 align-top">
                <SourceBadge source={extraction.source} />
              </TableCell>
              <TableCell className="py-3 pr-4 text-right align-top tabular-nums">
                {formatConfidence(extraction.confidence)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {inProgress && (
        <p role="status" className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          Extraction en cours…
        </p>
      )}
    </div>
  );
}
