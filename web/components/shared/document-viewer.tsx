"use client";

/**
 * The page a structured field was read from, outlined where it was found (J3): the argument the
 * pitch opens on, "look, it read this off your invoice," made visible rather than asserted.
 *
 * Only the page the selected field is on is fetched as an image; a document with no rendered
 * pages (any file predating this feature) shows the empty state rather than a broken image.
 */
import { useMemo, type JSX } from "react";
import { FileImageIcon } from "lucide-react";
import type { BBox } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { bboxToStyle } from "@/lib/positions";
import { useResource } from "@/lib/use-resource";
import { EmptyState } from "./api-state";

interface DocumentViewerProps {
  documentId: string;
  /** The page and outline to show; null shows the first page with no outline. */
  highlight: { page: number; bbox: BBox } | null;
}

export function DocumentViewer({ documentId, highlight }: DocumentViewerProps): JSX.Element {
  const pages = useResource(`document-pages:${documentId}`, (signal) =>
    api.getDocumentPages(documentId, signal),
  );

  const page = useMemo(() => {
    const entries = pages.data;
    if (!entries || entries.length === 0) return undefined;
    return entries.find((entry) => entry.page === highlight?.page) ?? entries[0];
  }, [pages.data, highlight]);

  if (!page) {
    return (
      <EmptyState
        icon={FileImageIcon}
        title="Aperçu du document indisponible"
        description="Ce document a été déposé avant que l’aperçu de page n’existe, ou n’a produit aucune page exploitable."
      />
    );
  }

  const box = highlight && highlight.page === page.page ? highlight.bbox : null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/20">
      {/* eslint-disable-next-line @next/next/no-img-element -- a locally-served page render, not an optimisable remote asset */}
      <img src={page.image_url} alt={`Page ${page.page} du document`} className="block w-full" />
      {box && (
        <div
          role="presentation"
          className="absolute rounded-sm border-2 border-ring bg-primary/10"
          style={bboxToStyle(box, page.width, page.height)}
        />
      )}
    </div>
  );
}
