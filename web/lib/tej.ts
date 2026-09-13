/**
 * Pure mapping between the TEJ declaration form and the export request body.
 *
 * The form speaks the officer's units (dinars, a percentage, a calendar date); the DGI schema
 * wants integer millimes, a two-decimal rate and a DD/MM/YYYY date (schemas/tej/TEJDeclarationRS_v1.0.xsd).
 * Conversion happens here and nowhere else. Nothing is computed from other fields.
 */
import type { TaxpayerCategory, TejExportDraft, TejExportRequest } from "./api-types";

/** Every form value as typed by the officer; selects and inputs are strings, checkboxes booleans. */
export interface TejFormValues {
  /** YYYY-MM, from a month input. */
  period: string;
  acteDepot: string;
  declarantMatricule: string;
  declarantCategorie: string;
  beneficiaryName: string;
  beneficiaryMatricule: string;
  beneficiaryCategorie: string;
  beneficiaryAddress: string;
  beneficiaryEmail: string;
  beneficiaryPhone: string;
  beneficiaryResident: boolean;
  /** YYYY-MM-DD, from a date input. */
  paymentDate: string;
  reference: string;
  code: string;
  invoiceYear: string;
  /** Percentage, such as "1.5". */
  rate: string;
  /** Percentage, such as "19". Empty means no VAT rate reported: the operation omits TauxTVA. */
  vatRate: string;
  /** Dinars, such as "1000.500". */
  amountExclTax: string;
  /** Dinars. Empty means no VAT reported: the operation omits MontantTVA. */
  amountVat: string;
  amountInclTax: string;
  amountWithheld: string;
  amountNetPaid: string;
  cnpc: boolean;
  pCharge: boolean;
}

const pad = (value: number): string => String(value).padStart(2, "0");

/** Starting values: the current period and year, and the filing organisation as declarant. */
export function initialTejFormValues(declarantTaxId: string, today: Date): TejFormValues {
  const year = String(today.getFullYear());
  const month = pad(today.getMonth() + 1);
  return {
    period: `${year}-${month}`,
    acteDepot: "0",
    declarantMatricule: declarantTaxId,
    declarantCategorie: "PM",
    beneficiaryName: "",
    beneficiaryMatricule: "",
    beneficiaryCategorie: "PM",
    beneficiaryAddress: "",
    beneficiaryEmail: "",
    beneficiaryPhone: "",
    beneficiaryResident: true,
    paymentDate: `${year}-${month}-${pad(today.getDate())}`,
    reference: "",
    code: "",
    invoiceYear: year,
    rate: "",
    vatRate: "",
    amountExclTax: "",
    amountVat: "",
    amountInclTax: "",
    amountWithheld: "",
    amountNetPaid: "",
    cnpc: false,
    pCharge: false,
  };
}

/** "2026-03-15" to "15/03/2026". */
export function toTejDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** Dinars with up to three decimals, comma or point, to integer millimes. Invalid input gives NaN, which the backend refuses. */
export function dinarsToMillimes(dinars: string): number {
  return Math.round(Number(dinars.trim().replace(",", ".")) * 1000);
}

/** A percentage to the schema's two-decimal form: "1.5" to "1.50". */
export function formatRate(rate: string): string {
  return Number(rate.trim().replace(",", ".")).toFixed(2);
}

function category(value: string): TaxpayerCategory {
  return value === "PP" ? "PP" : "PM";
}

/** A refused export, read for the form: one French message per field, and the messages no field matches. */
export interface ExportFieldErrors {
  fields: Partial<Record<keyof TejFormValues, string>>;
  unplaced: string[];
}

// Request body paths (api/app/api/v1/export.py) with list indexes dropped: the form holds one
// certificate with one operation.
const FIELD_BY_PATH = new Map<string, keyof TejFormValues>([
  ["declarant_matricule_fiscal", "declarantMatricule"],
  ["declarant_categorie", "declarantCategorie"],
  ["annee_depot", "period"],
  ["mois_depot", "period"],
  ["acte_depot", "acteDepot"],
  ["certificats.beneficiaire.matricule_fiscal", "beneficiaryMatricule"],
  ["certificats.beneficiaire.categorie", "beneficiaryCategorie"],
  ["certificats.beneficiaire.nom_ou_raison_sociale", "beneficiaryName"],
  ["certificats.beneficiaire.adresse", "beneficiaryAddress"],
  ["certificats.beneficiaire.email", "beneficiaryEmail"],
  ["certificats.beneficiaire.telephone", "beneficiaryPhone"],
  ["certificats.beneficiaire.resident", "beneficiaryResident"],
  ["certificats.date_payement", "paymentDate"],
  ["certificats.reference", "reference"],
  ["certificats.operations.code", "code"],
  ["certificats.operations.annee_facturation", "invoiceYear"],
  ["certificats.operations.montant_ht", "amountExclTax"],
  ["certificats.operations.taux_rs", "rate"],
  ["certificats.operations.taux_tva", "vatRate"],
  ["certificats.operations.montant_tva", "amountVat"],
  ["certificats.operations.montant_ttc", "amountInclTax"],
  ["certificats.operations.montant_rs", "amountWithheld"],
  ["certificats.operations.montant_net_servi", "amountNetPaid"],
  ["certificats.operations.cnpc", "cnpc"],
  ["certificats.operations.p_charge", "pCharge"],
]);

const MATRICULE_MESSAGE = "Le matricule fiscal doit comporter 7 chiffres suivis d’une lettre majuscule (schéma TEJ).";
const RATE_MESSAGE = "Le taux doit être compris entre 0 et 100, avec au plus deux décimales (schéma TEJ).";
const AMOUNT_MESSAGE = "Le montant doit être un nombre de dinars, avec au plus trois décimales.";

// Each message restates the constraint schemas/tej/TEJDeclarationRS_v1.0.xsd sets on that value.
const FIELD_MESSAGES: Partial<Record<keyof TejFormValues, string>> = {
  declarantMatricule: MATRICULE_MESSAGE,
  beneficiaryMatricule: MATRICULE_MESSAGE,
  period: "La période doit être un mois d’une année comprise entre 2000 et 2099 (schéma TEJ).",
  invoiceYear: "L’année de facturation doit être comprise entre 2000 et 2099 (schéma TEJ).",
  paymentDate: "La date de paiement doit être une date du calendrier, au format JJ/MM/AAAA (schéma TEJ).",
  beneficiaryEmail: "L’adresse e-mail n’a pas le format admis par le schéma TEJ.",
  code: "Ce code ne figure pas dans la liste des codes d’opération du schéma TEJ.",
  rate: RATE_MESSAGE,
  vatRate: RATE_MESSAGE,
  amountExclTax: AMOUNT_MESSAGE,
  amountVat: AMOUNT_MESSAGE,
  amountInclTax: AMOUNT_MESSAGE,
  amountWithheld: AMOUNT_MESSAGE,
  amountNetPaid: AMOUNT_MESSAGE,
};

// The sums api/app/export/field_errors.py checks, which the schema cannot (C3).
const ARITHMETIC_MESSAGES = new Map<string, string>([
  ["arithmetic.ht_plus_tva", "Le montant TTC doit être égal au montant hors taxes augmenté du montant de TVA."],
  ["arithmetic.rs_plus_net", "Le montant retenu et le montant net servi doivent totaliser le montant TTC."],
]);

function fieldMessage(field: keyof TejFormValues, type: string): string {
  const arithmetic = ARITHMETIC_MESSAGES.get(type);
  if (arithmetic) return arithmetic;
  if (FIELD_MESSAGES[field]) return FIELD_MESSAGES[field];
  return type.startsWith("xsd.") ? "Valeur refusée par le schéma TEJ." : "Valeur manquante ou invalide.";
}

/**
 * Places each error of a refused export (FastAPI's `{loc, msg, type}` detail, for request validation,
 * schema and arithmetic alike) on its form field. A field shows its first error only.
 */
export function exportFieldErrors(body: unknown): ExportFieldErrors {
  const result: ExportFieldErrors = { fields: {}, unplaced: [] };
  const detail = typeof body === "object" && body !== null && "detail" in body ? body.detail : null;
  if (!Array.isArray(detail)) return result;

  for (const item of detail) {
    if (typeof item !== "object" || item === null) continue;
    const { loc, msg, type } = item as { loc?: unknown; msg?: unknown; type?: unknown };
    const path = Array.isArray(loc) ? loc.filter((part) => typeof part === "string" && part !== "body").join(".") : "";
    const field = FIELD_BY_PATH.get(path);
    if (field === undefined) {
      result.unplaced.push(String(msg));
    } else {
      result.fields[field] ??= fieldMessage(field, typeof type === "string" ? type : "");
    }
  }
  return result;
}

/** The export request for one certificate with one operation, the case the form covers. */
export function buildExportRequest(values: TejFormValues): TejExportRequest {
  const [annee, mois] = values.period.split("-");
  return {
    declarant_matricule_fiscal: values.declarantMatricule.trim().toUpperCase(),
    declarant_categorie: category(values.declarantCategorie),
    annee_depot: annee,
    mois_depot: mois,
    acte_depot: values.acteDepot === "1" ? "1" : "0",
    certificats: [
      {
        beneficiaire: {
          matricule_fiscal: values.beneficiaryMatricule.trim().toUpperCase(),
          categorie: category(values.beneficiaryCategorie),
          nom_ou_raison_sociale: values.beneficiaryName.trim(),
          adresse: values.beneficiaryAddress.trim(),
          email: values.beneficiaryEmail.trim(),
          telephone: values.beneficiaryPhone.trim(),
          resident: values.beneficiaryResident,
        },
        date_payement: toTejDate(values.paymentDate),
        reference: values.reference.trim(),
        operations: [
          {
            code: values.code,
            annee_facturation: values.invoiceYear.trim(),
            montant_ht: dinarsToMillimes(values.amountExclTax),
            taux_rs: formatRate(values.rate),
            montant_ttc: dinarsToMillimes(values.amountInclTax),
            montant_rs: dinarsToMillimes(values.amountWithheld),
            montant_net_servi: dinarsToMillimes(values.amountNetPaid),
            ...(values.vatRate.trim() ? { taux_tva: formatRate(values.vatRate) } : {}),
            ...(values.amountVat.trim() ? { montant_tva: dinarsToMillimes(values.amountVat) } : {}),
            cnpc: values.cnpc,
            p_charge: values.pCharge,
          },
        ],
      },
    ],
  };
}

/** The string-valued keys of TejFormValues (excludes the boolean checkbox fields). */
export type TejFormTextKey = { [K in keyof TejFormValues]: TejFormValues[K] extends string ? K : never }[keyof TejFormValues];

/** Which form field each export-draft value fills. Keys match TejExportDraftValues (lib/api-types.ts). */
const DRAFT_FIELD_TO_FORM_KEY: Record<string, TejFormTextKey> = {
  declarant_matricule_fiscal: "declarantMatricule",
  beneficiary_name: "beneficiaryName",
  beneficiary_matricule_fiscal: "beneficiaryMatricule",
  beneficiary_address: "beneficiaryAddress",
  invoice_year: "invoiceYear",
  code: "code",
  rate: "rate",
  amount_excl_tax: "amountExclTax",
  amount_vat: "amountVat",
  amount_incl_tax: "amountInclTax",
  amount_withheld: "amountWithheld",
  amount_net_paid: "amountNetPaid",
  reference: "reference",
};

/**
 * Overlays a derived export draft onto the current form values.
 *
 * Every value stays editable afterwards: this only sets initial content and reports which keys
 * came from the document (D-008, the officer decides and owns the whole payload regardless).
 */
export function applyExportDraft(
  current: TejFormValues,
  draft: TejExportDraft,
): { values: TejFormValues; prefilledKeys: Set<TejFormTextKey> } {
  const values = { ...current };
  const prefilledKeys = new Set<TejFormTextKey>();
  for (const [draftField, formKey] of Object.entries(DRAFT_FIELD_TO_FORM_KEY)) {
    const value = draft.values[draftField as keyof typeof draft.values];
    if (value !== null && value !== undefined) {
      values[formKey] = value;
      prefilledKeys.add(formKey);
    }
  }
  return { values, prefilledKeys };
}
