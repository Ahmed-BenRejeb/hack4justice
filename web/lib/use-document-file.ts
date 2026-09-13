"use client";

/** Polls one document and its findings together, so the two never render out of step. */
import { api } from "./api-client";
import type { DocumentDetail, Finding } from "./api-types";
import { DOCUMENT_POLL_MS } from "./config";
import { useResource, type Resource } from "./use-resource";

/** A document and its findings, as loaded at the same instant. */
export interface DocumentFile {
  document: DocumentDetail;
  findings: Finding[];
}

/** Loads and keeps refreshing the file shown on the MSME and officer review screens. */
export function useDocumentFile(documentId: string): Resource<DocumentFile> {
  return useResource(
    `document:${documentId}`,
    async (signal) => {
      const [detail, findings] = await Promise.all([
        api.getDocument(documentId, signal),
        api.getFindings(documentId, signal),
      ]);
      return { document: detail, findings };
    },
    DOCUMENT_POLL_MS,
  );
}
