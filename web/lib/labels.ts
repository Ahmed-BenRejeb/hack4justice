/**
 * French interface labels for backend identifiers. An identifier with no label yet
 * falls back to a readable form of itself instead of breaking the screen.
 */

const FIELD_LABELS = new Map<string, string>([
  ["full_text", "Texte intégral du document"],
  ["masked_text", "Texte masqué transmis au modèle"],
  ["supplier_name", "Fournisseur"],
  ["supplier_tax_id", "Matricule fiscal du fournisseur"],
  ["supplier_address", "Adresse du fournisseur"],
  ["client_name", "Client"],
  ["client_tax_id", "Matricule fiscal du client"],
  ["service_description", "Objet de la prestation"],
  ["invoice_date", "Date de facture"],
  ["invoice_reference", "Référence de la facture"],
  ["amount_excl_tax", "Montant hors taxes"],
  ["amount_vat", "Montant de la TVA"],
  ["amount_incl_tax", "Montant TTC"],
  ["withholding_rate", "Taux de retenue à la source"],
  ["withholding_amount", "Montant de la retenue"],
  ["amount_net_paid", "Montant net payé"],
  ["payment_category", "Catégorie du paiement"],
  ["beneficiary_fiscal_regime", "Régime fiscal du bénéficiaire"],
  // Read by the Article 52, I, a) rule itself (api/app/rules/cirppis_art52_honoraires.py).
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

/**
 * The question a person answers to resolve an abstention, and the label of each value the
 * backend accepts (J4). A fact with no entry here is not asked on screen, even if the backend
 * would accept it: an unlabelled question would put its wording in the backend, which holds no
 * interface copy (D-039).
 */
const FACT_QUESTIONS = new Map<string, { question: string; options: Map<string, string> }>([
  [
    "beneficiary_fiscal_regime",
    {
      question: "Le fournisseur est-il soumis à l’impôt selon le régime réel ?",
      options: new Map([
        ["reel", "Oui, régime réel"],
        ["forfait", "Non, forfait d’assiette"],
      ]),
    },
  ],
]);

/** The question and answer labels for a fact, or null when it is not asked on screen. */
export function factQuestion(
  factName: string,
): { question: string; options: Map<string, string> } | null {
  return FACT_QUESTIONS.get(factName) ?? null;
}

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
