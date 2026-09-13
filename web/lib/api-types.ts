/**
 * Wire types for the backend REST API under /api/v1.
 *
 * They mirror the Pydantic request and response models in api/app/api/v1/ and carry only
 * what the UI reads. A change on one side is made on the other in the same commit
 * (docs/decision-log.md D-024).
 */

/** Whether a field was read from the document, or supplied by the model with a confidence for an assisted rule. */
export type ExtractionSource = "extracted" | "assisted";

/** One field pulled from an uploaded document. Today the backend records a single `full_text` field. */
export interface Extraction {
  id: string;
  field_name: string;
  value: string;
  /** Between 0 and 1. */
  confidence: number;
  source: ExtractionSource;
}

/** An organisation documents are filed for (GET /organisations). */
export interface Organisation {
  id: string;
  name: string;
  tax_id: string;
  kind: string;
}

/** POST /organisations body. */
export interface OrganisationInput {
  name: string;
  tax_id: string;
}

/** The verbatim legal text that grounds a rule. */
export interface Citation {
  citation_source: string;
  article_ref: string;
  verbatim_text: string;
  url: string;
}

/** A rule registry entry (GET /rules). */
export interface Rule extends Citation {
  id: string;
  code: string;
  logic_ref: string;
}

/** A rule either reached a finding or abstained; an abstention is a correct outcome, not an error. */
export type FindingStatus = "decided" | "abstained";

/** Where a fact a rule used came from: read in the document, or supplied by the model. */
export type TraceSource = "document" | "model";

/** One fact a rule used, in the order the rule used it (J1). */
export interface TraceStep {
  fact: string;
  source: TraceSource;
  /** A boolean for a yes-or-no fact; null when the fact could not be established. */
  value: string | boolean | null;
  /** Between 0 and 1, set when the model supplied the fact. */
  confidence: number | null;
  /** The confidence the rule required, between 0 and 1. */
  threshold: number | null;
}

/** GET /documents/{id}/findings: one rule outcome with its rule code and citation resolved. */
export interface Finding {
  id: string;
  rule_code: string;
  status: FindingStatus;
  /** Set when status is "decided". */
  decided_code: string | null;
  /** Set when status is "abstained": the specific fact the rule needs and could not establish. */
  missing_fact: string | null;
  /** The facts the rule used; empty for findings recorded before traces existed. */
  trace: TraceStep[];
  created_at: string;
  citation: Citation;
}

/** The only two actions an officer takes on a file. */
export type OfficerAction = "validated" | "flagged";

/** The human-authority step that must precede export. */
export interface OfficerDecision {
  id: string;
  document_id: string;
  officer_id: string;
  action: OfficerAction;
  note: string | null;
  decided_at: string;
}

/** A produced TEJ XML file and the outcome of its XSD validation. */
export interface TejExport {
  id: string;
  document_id: string;
  xml_ref: string;
  xsd_validated: boolean;
  validated_at: string;
}

/** POST /documents response: the stored document. */
export interface DocumentSummary {
  id: string;
  organisation_id: string;
  uploaded_by: string;
  filename: string;
  status: string;
  created_at: string;
}

/** GET /documents/{id}: the document and everything the pipeline has produced for it so far. */
export interface DocumentDetail extends DocumentSummary {
  organisation: Organisation;
  extractions: Extraction[];
  officer_decision: OfficerDecision | null;
  export: TejExport | null;
}

/** GET /officer/queue: one file awaiting review, summarised for a dense list. */
export interface QueueItem {
  id: string;
  organisation_id: string;
  organisation_name: string;
  uploaded_by: string;
  filename: string;
  status: string;
  created_at: string;
  decided_count: number;
  abstained_count: number;
  /** Distinct facts the file's abstentions name, sorted (J8). */
  missing_facts: string[];
}

/** POST /officer/decisions body. */
export interface OfficerDecisionInput {
  document_id: string;
  officer_id: string;
  action: OfficerAction;
  note: string | null;
}

/** How a search found a passage: by an exact term, by meaning, or both. */
export type PassageMatch = "texte" | "sens" | "les deux";

/** A legal passage a person has verified. Unverified text never leaves the backend (D-029). */
export interface Passage {
  id: string;
  source_id: string;
  source_title: string;
  source_edition: string;
  article_ref: string;
  /** "I, a), tiret 2"; empty for an article's lead text. */
  paragraph_ref: string;
  /** Page in the official PDF, starting at 1. */
  page: number;
  verified_by: string;
  /** YYYY-MM-DD. */
  verified_on: string;
  /** The official PDF opened at the passage's page. */
  official_url: string;
}

/** A verified passage with its full text. */
export interface PassageText extends Passage {
  text: string;
}

/** GET /corpus/search and GET /findings/{id}/related entry. */
export interface PassageHit extends Passage {
  /** Matched terms sit between U+0002 and U+0003: split on them, never render the excerpt as HTML. */
  excerpt: string;
  match: PassageMatch;
}

/** An official document the corpus is indexed from. */
export interface CorpusSource {
  id: string;
  title: string;
  edition: string;
  publisher: string;
  url: string;
  sha256: string;
  language: string;
  page_count: number;
  loaded_at: string;
}

/** GET /corpus/sources entry. */
export interface CorpusSourceSummary extends CorpusSource {
  verified_passages: number;
  total_passages: number;
  /** Codes of the rules whose citation URL is this source. */
  citing_rules: string[];
}

/** GET /corpus/chunks/{id}: a verified passage for the source reader. */
export interface PassageDetail {
  passage: PassageText;
  /** Null when the neighbouring paragraph is absent or not verified. */
  previous: PassageText | null;
  next: PassageText | null;
  /** The article's verified passages, in document order. */
  outline: Passage[];
  source: CorpusSource;
}

/** GET /corpus/verification-queue entry: a reference to check on the official page, never text. */
export interface VerificationQueueEntry {
  id: string;
  source_id: string;
  article_ref: string;
  paragraph_ref: string;
  page: number;
  official_url: string;
}

/** GET /export/operation-codes entry, read from the DGI TEJ schema. */
export interface OperationCode {
  code: string;
  description: string;
}

/** PP: personne physique. PM: personne morale. */
export type TaxpayerCategory = "PP" | "PM";

/** The payee of a withholding certificate. */
export interface TejBeneficiaryInput {
  matricule_fiscal: string;
  categorie: TaxpayerCategory;
  nom_ou_raison_sociale: string;
  adresse: string;
  email: string;
  telephone: string;
  resident: boolean;
}

/** One withheld operation. Amounts are integers in the unit the TEJ schema expects. */
export interface TejOperationInput {
  code: string;
  annee_facturation: string;
  montant_ht: number;
  taux_rs: string;
  montant_ttc: number;
  montant_rs: number;
  montant_net_servi: number;
  /** Omitted when no VAT is reported. */
  taux_tva?: string;
  montant_tva?: number;
  cnpc: boolean;
  p_charge: boolean;
}

/** One withholding certificate: a beneficiary, a payment and its operations. */
export interface TejCertificateInput {
  beneficiaire: TejBeneficiaryInput;
  /** DD/MM/YYYY. */
  date_payement: string;
  reference: string;
  operations: TejOperationInput[];
}

/** POST /documents/{id}/export body. */
export interface TejExportRequest {
  declarant_matricule_fiscal: string;
  declarant_categorie: TaxpayerCategory;
  annee_depot: string;
  mois_depot: string;
  acte_depot: "0" | "1";
  certificats: TejCertificateInput[];
}

/** A pre-filled export draft, projected from what was read off the document. Every value stays editable. */
export interface TejExportDraftValues {
  declarant_matricule_fiscal: string | null;
  beneficiary_name: string | null;
  beneficiary_matricule_fiscal: string | null;
  beneficiary_address: string | null;
  invoice_year: string | null;
  code: string | null;
  /** Percentage, such as "1.5". */
  rate: string | null;
  /** Dinars, such as "1000.500". */
  amount_excl_tax: string | null;
  amount_vat: string | null;
  amount_incl_tax: string | null;
  amount_withheld: string | null;
  amount_net_paid: string | null;
  reference: string | null;
}

/** GET /documents/{id}/export-draft: officer units throughout, so lib/tej.ts stays the only conversion boundary. */
export interface TejExportDraft {
  values: TejExportDraftValues;
  /** Names of the fields in `values` that came from the document, not typed by the officer. */
  derived_fields: string[];
}
