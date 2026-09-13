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

/** GET /documents/{id}/findings: one rule outcome with its rule code and citation resolved. */
export interface Finding {
  id: string;
  rule_code: string;
  status: FindingStatus;
  /** Set when status is "decided". */
  decided_code: string | null;
  /** Set when status is "abstained": the specific fact the rule needs and could not establish. */
  missing_fact: string | null;
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
}

/** POST /officer/decisions body. */
export interface OfficerDecisionInput {
  document_id: string;
  officer_id: string;
  action: OfficerAction;
  note: string | null;
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
  /** Optional: omitted certificates report no VAT. */
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
