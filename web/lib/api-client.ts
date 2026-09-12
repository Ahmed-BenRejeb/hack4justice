/**
 * Typed browser client for the backend (api/app/api/v1/).
 *
 * Every call goes through the Next.js proxy at /api/v1 (app/api/v1/[...path]/route.ts),
 * so the backend origin is configured once on the server and never reaches the browser.
 */
import type {
  DocumentDetail,
  DocumentSummary,
  Finding,
  OfficerDecision,
  OfficerDecisionInput,
  OperationCode,
  Organisation,
  OrganisationInput,
  QueueItem,
  Rule,
  TejExport,
  TejExportRequest,
} from "./api-types";

const BASE_PATH = "/api/v1";

/** A failed call. `status` is the HTTP status, or 0 when the request never reached a server. */
export class ApiError extends Error {
  readonly status: number;
  /** Each message from the response body, such as every XSD validation error of a refused export. */
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Extracts readable messages from an error body. FastAPI sends `detail` as a string, a list of
 * validation errors (objects with `msg`), or, for a refused export, a list of plain strings.
 */
export function errorMessages(body: unknown): string[] {
  if (typeof body !== "object" || body === null || !("detail" in body)) return [];
  const { detail } = body;
  if (typeof detail === "string") return [detail];
  if (!Array.isArray(detail)) return [];
  return detail
    .map((item: unknown) => {
      if (typeof item === "string") return item;
      return typeof item === "object" && item !== null && "msg" in item ? String(item.msg) : null;
    })
    .filter((message): message is string => message !== null);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_PATH}${path}`, { cache: "no-store", ...init });
  } catch (error) {
    // Aborts are the caller's own cancellation, not a failure to report.
    if (init?.signal?.aborted) throw error;
    throw new ApiError(0, "Network request failed");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const messages = errorMessages(body);
    throw new ApiError(response.status, messages.join("; ") || response.statusText, messages);
  }
  return (await response.json()) as T;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const documentPath = (id: string): string => `/documents/${encodeURIComponent(id)}`;

/** The backend operations the UI uses, one method per endpoint. */
export const api = {
  /** GET /organisations: every organisation, alphabetically. */
  listOrganisations(signal?: AbortSignal): Promise<Organisation[]> {
    return request("/organisations", { signal });
  },

  /** POST /organisations: creates an MSME; a duplicate tax id is refused with 409. */
  createOrganisation(input: OrganisationInput): Promise<Organisation> {
    return postJson("/organisations", input);
  },

  /** POST /documents: uploads a payment file; extraction and rule evaluation run before it returns. */
  uploadDocument(file: File, organisationId: string, uploadedBy: string): Promise<DocumentSummary> {
    const form = new FormData();
    form.append("file", file);
    const query = new URLSearchParams({ organisation_id: organisationId, uploaded_by: uploadedBy });
    return request(`/documents?${query}`, { method: "POST", body: form });
  },

  /** GET /documents/{id}: status, organisation, extraction results, decision and export. */
  getDocument(id: string, signal?: AbortSignal): Promise<DocumentDetail> {
    return request(documentPath(id), { signal });
  },

  /** GET /documents/{id}/findings: findings with their rule code and citation resolved. */
  getFindings(id: string, signal?: AbortSignal): Promise<Finding[]> {
    return request(`${documentPath(id)}/findings`, { signal });
  },

  /** GET /officer/queue: extracted files awaiting an officer decision. */
  getOfficerQueue(signal?: AbortSignal): Promise<QueueItem[]> {
    return request("/officer/queue", { signal });
  },

  /** POST /officer/decisions: validates or flags a file. */
  submitOfficerDecision(input: OfficerDecisionInput): Promise<OfficerDecision> {
    return postJson("/officer/decisions", input);
  },

  /** GET /export/operation-codes: the withholding codes the TEJ schema accepts. */
  listOperationCodes(signal?: AbortSignal): Promise<OperationCode[]> {
    return request("/export/operation-codes", { signal });
  },

  /** POST /documents/{id}/export: builds the TEJ XML and validates it against the XSD. */
  exportDocument(id: string, body: TejExportRequest): Promise<TejExport> {
    return postJson(`${documentPath(id)}/export`, body);
  },

  /** GET /rules: the rule registry. */
  listRules(signal?: AbortSignal): Promise<Rule[]> {
    return request("/rules", { signal });
  },
};
