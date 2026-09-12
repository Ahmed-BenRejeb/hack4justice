/**
 * Structured fields read from a document. Only assisted facts are marked, and the legend that
 * explains them is always visible rather than hidden in a tooltip.
 */
import type { JSX } from "react";
import { FileSearchIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Extraction } from "@/lib/api-types";
import { countLabel, formatConfidence } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { EmptyState } from "./api-state";

interface ExtractionTableProps {
  extractions: Extraction[];
  /** True while the pipeline has not yet produced findings, so more fields may still arrive. */
  inProgress: boolean;
}

function footerText(extractions: Extraction[], inProgress: boolean): string {
  if (inProgress) return "Extraction en cours…";
  const assisted = extractions.filter((extraction) => extraction.source === "assisted").length;
  const total = countLabel(extractions.length, "champ", "champs");
  if (assisted === 0) return `${total}, tous lus sur le document.`;
  return `${total}, dont ${countLabel(assisted, "assisté", "assistés")}. Assisté : fait absent du document, fourni par le modèle avec un indice de confiance ; la règle décide, jamais le modèle.`;
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
            <TableHead className="w-2/5 px-4">Champ</TableHead>
            <TableHead>Valeur</TableHead>
            <TableHead className="pr-4 text-right">Confiance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extractions.map((extraction) => {
            const isAssisted = extraction.source === "assisted";
            return (
              <TableRow key={extraction.id} className="animate-field-in">
                <TableCell className="px-4 py-2.5 align-top whitespace-normal text-muted-foreground">
                  {fieldLabel(extraction.field_name)}
                </TableCell>
                <TableCell className="py-2.5 align-top whitespace-normal">
                  <span className="font-medium break-words">{extraction.value}</span>
                  {isAssisted && (
                    <Badge variant="secondary" className="ml-2 align-text-bottom">
                      Assisté
                    </Badge>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "py-2.5 pr-4 text-right align-top tabular-nums",
                    isAssisted ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {formatConfidence(extraction.confidence)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p role={inProgress ? "status" : undefined} className="border-t px-4 py-2.5 text-xs text-muted-foreground">
        {footerText(extractions, inProgress)}
      </p>
    </div>
  );
}
