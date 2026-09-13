"use client";

/** What a person may confirm about a file's supplier (J4), loaded once per file. */
import { api } from "./api-client";
import type { AnswerableFacts } from "./api-types";
import { useResource, type Resource } from "./use-resource";

/**
 * Not polled: the answerable facts depend on the registry and on the supplier read at
 * extraction, neither of which changes while the file is open.
 */
export function useAnswerableFacts(documentId: string): Resource<AnswerableFacts> {
  return useResource(`answerable-facts:${documentId}`, (signal) =>
    api.getAnswerableFacts(documentId, signal),
  );
}
