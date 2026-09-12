/**
 * Typed browser client for the backend (docs/architecture.md section 5).
 *
 * Every call goes through the Next.js proxy at /api/v1 (app/api/v1/[...path]/route.ts),
 * so the backend origin is configured once on the server and never reaches the browser.
 */
import type {
  CounterpartyCheck,
  DocumentDetail,
  Finding,
  OfficerDecision,
  OfficerDecisionInput,
  QueueItem,
  Rule,
  TejExport,
} from "./api-types";

const BASE_PATH = "/api/v1";

/** A failed call. `status` is the HTTP status, or 0 when the request never reached a server. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Extracts a readable message from an error body. FastAPI sends `detail` as a string or as a list of validation errors. */
export function errorDetail(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("detail" in body)) return null;
  const { detail } = body;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return null;
  const messages = detail
    .map((item: unknown) =>
      typeof item === "object" && item !== null && "msg" in item ? String(item.msg) : null,
    )
    .filter((message): message is string => message !== null);
  return messages.length > 0 ? messages.join("; ") : null;
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
    throw new ApiError(response.status, errorDetail(body) ?? response.statusText);
  }
  return (await response.json()) as T;
}

function postJson<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const documentPath = (id: string): string => `/documents/${encodeURIComponent(id)}`;

/** The backend operations the UI uses, one method per endpoint. */
export const api = {
  /** POST /documents: uploads a payment file and starts extraction. */
  uploadDocument(file: File): Promise<DocumentDetail> {
    const form = new FormData();
    form.append("file", file);
    return request("/documents", { method: "POST", body: form });
  },

  /** GET /documents/{id}: status, extraction results, counterparty check, decision and export. */
  getDocument(id: string, signal?: AbortSignal): Promise<DocumentDetail> {
    return request(documentPath(id), { signal });
  },

  /** GET /documents/{id}/findings: findings with their citations resolved. */
  getFindings(id: string, signal?: AbortSignal): Promise<Finding[]> {
    return request(`${documentPath(id)}/findings`, { signal });
  },

  /** POST /documents/{id}/counterparty-check: runs the RNE lookup. */
  runCounterpartyCheck(id: string): Promise<CounterpartyCheck> {
    return postJson(`${documentPath(id)}/counterparty-check`);
  },

  /** GET /officer/queue: pre-qualified files awaiting review. */
  getOfficerQueue(signal?: AbortSignal): Promise<QueueItem[]> {
    return request("/officer/queue", { signal });
  },

  /** POST /officer/decisions: validates or flags a file. */
  submitOfficerDecision(input: OfficerDecisionInput): Promise<OfficerDecision> {
    return postJson("/officer/decisions", input);
  },

  /** POST /documents/{id}/export: produces the TEJ XML and validates it against the XSD. */
  exportDocument(id: string): Promise<TejExport> {
    return postJson(`${documentPath(id)}/export`);
  },

  /** GET /rules: the rule registry. */
  listRules(signal?: AbortSignal): Promise<Rule[]> {
    return request("/rules", { signal });
  },
};
