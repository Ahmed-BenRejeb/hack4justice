"use client";

/**
 * What the backend read from a document: the full text beside the masked copy that is the only text
 * sent to the model (J5), and a table of structured fields once field-level extraction exists. A field
 * located on the page (J3) can be selected to outline it in the document viewer alongside the table.
 * Assisted fields carry a visible legend.
 */
import { useState, type JSX } from "react";
import { FileSearchIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Extraction } from "@/lib/api-types";
import { formatConfidence } from "@/lib/format";
import { fieldLabel } from "@/lib/labels";
import { splitPlaceholders } from "@/lib/masking";
import { EmptyState } from "./api-state";
import { DocumentViewer } from "./document-viewer";

/** The field names api/app/extraction/service.py uses for the whole text and its masked copy. */
const FULL_TEXT_FIELD = "full_text";
const MASKED_TEXT_FIELD = "masked_text";

interface FieldTableProps {
  fields: Extraction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function FieldTable({ fields, selectedId, onSelect }: FieldTableProps): JSX.Element {
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
            const locatable = field.bbox !== null && field.page !== null;
            return (
              <TableRow
                key={field.id}
                data-selected={locatable && field.id === selectedId ? "" : undefined}
                aria-selected={locatable ? field.id === selectedId : undefined}
                tabIndex={locatable ? 0 : undefined}
                onClick={locatable ? () => onSelect(field.id) : undefined}
                onKeyDown={
                  locatable
                    ? (event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onSelect(field.id);
                      }
                    : undefined
                }
                className={cn(
                  locatable &&
                    "cursor-pointer outline-none data-[selected]:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
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

function TextPanel({ title, aside, children }: { title: string; aside: string; children: JSX.Element }): JSX.Element {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground tabular-nums">{aside}</span>
      </div>
      {children}
    </div>
  );
}

function TextRegion({ label, children }: { label: string; children: JSX.Element | string }): JSX.Element {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-h-96 overflow-auto px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap"
    >
      {children}
    </div>
  );
}

function FullText({ extraction }: { extraction: Extraction }): JSX.Element {
  const text = extraction.value.trim();
  return (
    <TextPanel title="Texte lu sur le document" aside={`Fiabilité de lecture ${formatConfidence(extraction.confidence)}`}>
      {text ? (
        <TextRegion label="Texte lu sur le document">{text}</TextRegion>
      ) : (
        <p className="px-4 py-3 text-sm text-muted-foreground">Aucun texte n’a pu être lu sur ce document.</p>
      )}
    </TextPanel>
  );
}

/** "Ce qui quitte le poste": the masked copy, placeholders marked, stated as the only text the model receives. */
function MaskedText({ extraction }: { extraction: Extraction }): JSX.Element {
  const segments = splitPlaceholders(extraction.value.trim());
  const replaced = new Set(segments.filter((segment) => segment.placeholder).map((segment) => segment.text)).size;
  return (
    <TextPanel
      title="Ce qui quitte le poste"
      aside={replaced === 0 ? "Aucun identifiant détecté" : `${replaced} identifiant${replaced > 1 ? "s" : ""} masqué${replaced > 1 ? "s" : ""}`}
    >
      <>
        <p className="border-b px-4 py-2 text-xs text-muted-foreground">
          Seul ce texte est transmis au modèle. Les identifiants reconnus sont remplacés sur le poste ; un
          nom inconnu du système ou une adresse peut rester visible.
        </p>
        <TextRegion label="Texte transmis au modèle">
          <>
            {segments.map((segment, index) =>
              segment.placeholder ? (
                <mark key={index} className="rounded-sm bg-accent px-0.5 font-mono text-xs text-accent-foreground">
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </>
        </TextRegion>
      </>
    </TextPanel>
  );
}

interface ExtractionViewProps {
  documentId: string;
  extractions: Extraction[];
}

/** Structured fields (with the source page alongside, J3) first, then the full text beside its masked copy. */
export function ExtractionView({ documentId, extractions }: ExtractionViewProps): JSX.Element {
  const fields = extractions.filter(
    (extraction) => extraction.field_name !== FULL_TEXT_FIELD && extraction.field_name !== MASKED_TEXT_FIELD,
  );
  const firstLocatable = fields.find((field) => field.bbox !== null && field.page !== null);
  const [selectedId, setSelectedId] = useState<string | null>(firstLocatable?.id ?? null);

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
  const maskedText = extractions.find((extraction) => extraction.field_name === MASKED_TEXT_FIELD);
  const selected = fields.find((field) => field.id === selectedId);
  const highlight = selected?.bbox && selected.page !== null ? { page: selected.page, bbox: selected.bbox } : null;

  return (
    <div className="space-y-4">
      {fields.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <FieldTable fields={fields} selectedId={selectedId} onSelect={setSelectedId} />
          <DocumentViewer documentId={documentId} highlight={highlight} />
        </div>
      )}
      <div className={cn("grid gap-4", maskedText && "lg:grid-cols-2")}>
        {fullText && <FullText extraction={fullText} />}
        {maskedText && <MaskedText extraction={maskedText} />}
      </div>
    </div>
  );
}
