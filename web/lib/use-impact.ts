"use client";

/** One organisation's own measurement (J9, F1, MSME side), loaded once its id is known. */
import { api } from "./api-client";
import type { Measurement } from "./api-types";
import { useResource, type Resource } from "./use-resource";

/** Skips loading while no organisation is selected. */
export function useOrganisationImpact(organisationId: string): Resource<Measurement> {
  return useResource(organisationId ? `impact:${organisationId}` : null, (signal) =>
    api.getImpact(organisationId, signal),
  );
}
