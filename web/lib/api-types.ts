/**
 * Wire types for the backend REST API under /api/v1.
 *
 * Entity fields follow docs/architecture.md section 4 and carry only what the UI reads.
 * Where the architecture does not fix a response shape (document filename and timestamps,
 * queue rows, the findings payload embedding its rule), the shape here is the web side's
 * assumption, recorded in docs/decision-log.md D-017 for the backend to confirm.
 */

/** Whether a field was read from the document, or supplied by the model with a confidence for an assisted rule. */
export type ExtractionSource = "extracted" | "assisted";

/** One structured field pulled from an uploaded document. */
export interface Extraction {
  id: string;
  field_name: string;
  value: string;
  /** Between 0 and 1. */
  confidence: number;
  source: ExtractionSource;
  extracted_at: string;
}

/** A rule registry entry and the verbatim legal text that grounds it. */
export interface Rule {
  id: string;
  code: string;
  citation_source: string;
  article_ref: string;
  verbatim_text: string;
  url: string;
  logic_ref: string;
}

/** A rule either reached a finding or abstained; an abstention is a correct outcome, not an error. */
export type FindingStatus = "decided" | "abstained";

/** One evaluation outcome for one rule on one document, with its citation resolved. */
export interface Finding {
  id: string;
  rule_id: string;
  status: FindingStatus;
  /** Set when status is "decided". */
  decided_code: string | null;
  /** Set when status is "abstained": the specific fact the rule needs and could not establish. */
  missing_fact: string | null;
  created_at: string;
  rule: Rule;
}

/** RNE registration facts for the counterparty. Deliberately carries no score (D-007). */
export interface CounterpartyCheck {
  id: string;
  rne_id: string | null;
  registered: boolean;
  identifiers_match: boolean;
  status_text: string;
}

/** The only two actions an officer takes on a file. */
export type OfficerAction = "validated" | "flagged";

/** The human-authority step that must precede export. */
export interface OfficerDecision {
  id: string;
  officer_id: string;
  action: OfficerAction;
  note: string | null;
  decided_at: string;
}

/** A produced TEJ XML file and the outcome of its XSD validation. */
export interface TejExport {
  id: string;
  xml_ref: string;
  xsd_validated: boolean;
  validated_at: string | null;
}

/** GET /documents/{id}: the file and everything the pipeline has produced for it so far. */
export interface DocumentDetail {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
  extractions: Extraction[];
  counterparty_check: CounterpartyCheck | null;
  officer_decision: OfficerDecision | null;
  export: TejExport | null;
}

/** GET /officer/queue: one pre-qualified file, summarised for a dense list. */
export interface QueueItem {
  document_id: string;
  filename: string;
  organisation_name: string;
  submitted_at: string;
  status: string;
  decided_count: number;
  abstained_count: number;
  /** Null when no counterparty check has run. */
  counterparty_registered: boolean | null;
}

/** POST /officer/decisions body. */
export interface OfficerDecisionInput {
  document_id: string;
  action: OfficerAction;
  note: string | null;
}
