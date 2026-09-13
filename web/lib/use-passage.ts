"use client";

/** One verified passage with its neighbours, article outline and source (J2), loaded once per chunk. */
import { api } from "./api-client";
import type { PassageDetail } from "./api-types";
import { useResource, type Resource } from "./use-resource";

export function usePassage(chunkId: string): Resource<PassageDetail> {
  return useResource(`passage:${chunkId}`, (signal) => api.getPassage(chunkId, signal));
}
