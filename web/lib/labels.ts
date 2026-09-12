/**
 * French interface labels for backend identifiers. An identifier with no label yet
 * falls back to a readable form of itself instead of breaking the screen.
 */

const FIELD_LABELS = new Map<string, string>([
  ["supplier_name", "Fournisseur"],
  ["supplier_tax_id", "Matricule fiscal du fournisseur"],
  ["supplier_regime", "Régime fiscal du fournisseur"],
  ["supplier_status", "Statut du fournisseur"],
  ["client_name", "Client"],
  ["client_tax_id", "Matricule fiscal du client"],
  ["service_description", "Objet de la prestation"],
  ["service_nature", "Nature de la prestation"],
  ["invoice_number", "Numéro de facture"],
  ["invoice_date", "Date de facture"],
  ["payment_date", "Date de paiement"],
  ["amount_excl_tax", "Montant hors taxes"],
  ["amount_incl_tax", "Montant toutes taxes comprises"],
  ["vat_amount", "Montant de TVA"],
  ["fiscal_mentions", "Mentions fiscales"],
]);

const DOCUMENT_STATUS_LABELS = new Map<string, string>([
  ["uploaded", "Déposé"],
  ["extracting", "Extraction en cours"],
  ["evaluating", "Analyse en cours"],
  ["prequalified", "Pré-qualifié"],
  ["validated", "Validé"],
  ["flagged", "Signalé"],
  ["exported", "Exporté"],
  ["failed", "Échec du traitement"],
]);

/** Turns `some_identifier` into "Some identifier". */
function readable(identifier: string): string {
  const words = identifier.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Label for an extracted field name. */
export function fieldLabel(fieldName: string): string {
  return FIELD_LABELS.get(fieldName) ?? readable(fieldName);
}

/** Label for a document status value. */
export function documentStatusLabel(status: string): string {
  return DOCUMENT_STATUS_LABELS.get(status) ?? readable(status);
}
