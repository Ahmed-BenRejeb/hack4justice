/**
 * What the backend read from a document: the full text today, and a table of structured
 * fields once field-level extraction exists. Assisted fields carry a visible legend.
 */
import type { JSX } from "react";
import { FileSearchIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Extraction } from "@/lib/api-types";
import { formatConfidence } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { EmptyState } from "./api-state";

/** The field name api/app/extraction/service.py uses for the whole document text. */
const FULL_TEXT_FIELD = "full_text";

function FieldTable({ fields }: { fields: Extraction[] }): JSX.Element {
  const hasAssisted = fields.some((field) => field.source === "assisted");
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
          {fields.map((field) => {
            const isAssisted = field.source === "assisted";
            return (
              <TableRow key={field.id}>
                <TableCell className="px-4 py-2.5 align-top whitespace-normal text-muted-foreground">
                  {fieldLabel(field.field_name)}
                </TableCell>
                <TableCell className="py-2.5 align-top whitespace-normal">
                  <span className="font-medium break-words">{field.value}</span>
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
                  {formatConfidence(field.confidence)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {hasAssisted && (
        <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          Assisté : fait absent du document, fourni par le modèle avec un indice de confiance ; la
          règle décide, jamais le modèle.
        </p>
      )}
    </div>
  );
}

function FullText({ extraction }: { extraction: Extraction }): JSX.Element {
  const text = extraction.value.trim();
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs">
        <span className="font-medium">Texte lu sur le document</span>
        <span className="text-muted-foreground tabular-nums">
          Fiabilité de lecture {formatConfidence(extraction.confidence)}
        </span>
      </div>
      {text ? (
        <div
          role="region"
          aria-label="Texte lu sur le document"
          tabIndex={0}
          className="max-h-96 overflow-auto px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        >
          {text}
        </div>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground">Aucun texte n’a pu être lu sur ce document.</p>
      )}
    </div>
  );
}

/** Structured fields first when there are any, then the full text. */
export function ExtractionView({ extractions }: { extractions: Extraction[] }): JSX.Element {
  if (extractions.length === 0) {
    return (
      <EmptyState
        icon={FileSearchIcon}
        title="Aucun texte extrait"
        description="Le document n’a livré aucun contenu lisible."
      />
    );
  }
  const fullText = extractions.find((extraction) => extraction.field_name === FULL_TEXT_FIELD);
  const fields = extractions.filter((extraction) => extraction.field_name !== FULL_TEXT_FIELD);

  return (
    <div className="space-y-4">
      {fields.length > 0 && <FieldTable fields={fields} />}
      {fullText && <FullText extraction={fullText} />}
    </div>
  );
}
