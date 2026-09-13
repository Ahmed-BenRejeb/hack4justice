"use client";

/** Verified passages related to one finding's rule and missing fact (J2, J10), loaded once. */
import { api } from "./api-client";
import type { PassageHit } from "./api-types";
import { useResource, type Resource } from "./use-resource";

export function useRelatedPassages(findingId: string): Resource<PassageHit[]> {
  return useResource(`related-passages:${findingId}`, (signal) => api.getRelatedPassages(findingId, signal));
}
