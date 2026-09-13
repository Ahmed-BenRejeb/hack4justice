/**
 * French interface labels for backend identifiers. An identifier with no label yet
 * falls back to a readable form of itself instead of breaking the screen.
 */

const FIELD_LABELS = new Map<string, string>([
  ["full_text", "Texte intégral du document"],
  ["supplier_name", "Fournisseur"],
  ["supplier_tax_id", "Matricule fiscal du fournisseur"],
  ["client_name", "Client"],
  ["client_tax_id", "Matricule fiscal du client"],
  ["service_description", "Objet de la prestation"],
  ["invoice_date", "Date de facture"],
  ["amount_excl_tax", "Montant hors taxes"],
  // Facts the Article 52, I, a) rule uses (api/app/rules/cirppis_art52_honoraires.py).
  ["article_52_category", "Catégorie du paiement (honoraires, commissions, courtages, loyers)"],
  ["withholding_mention", "Mention « retenue » dans le texte"],
]);

// The statuses api/ writes: upload and extraction (documents.py), then the officer's action (officer.py).
const DOCUMENT_STATUS_LABELS = new Map<string, string>([
  ["uploaded", "Déposé"],
  ["extracted", "Lu, en attente d’examen"],
  ["extraction_failed", "Lecture impossible"],
  ["validated", "Validé"],
  ["flagged", "Signalé"],
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
