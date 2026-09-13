/** Unit tests for lib/tej.ts: the form-to-schema conversions an export depends on. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyExportDraft,
  buildExportRequest,
  dinarsToMillimes,
  exportFieldErrors,
  formatRate,
  initialTejFormValues,
  toTejDate,
} from "../lib/tej.ts";
import type { TejExportDraft } from "../lib/api-types.ts";

test("dates, amounts and rates convert to the schema's formats", () => {
  assert.equal(toTejDate("2026-03-15"), "15/03/2026");
  assert.equal(dinarsToMillimes("1000"), 1_000_000);
  assert.equal(dinarsToMillimes("1,5"), 1_500);
  assert.equal(dinarsToMillimes("12.345"), 12_345);
  assert.equal(dinarsToMillimes("0.001"), 1);
  assert.ok(Number.isNaN(dinarsToMillimes("douze")));
  assert.equal(formatRate("1.5"), "1.50");
  assert.equal(formatRate("15"), "15.00");
});

test("initial values take the current period and the filing organisation as declarant", () => {
  const values = initialTejFormValues("1234567A", new Date(2026, 8, 5));
  assert.equal(values.period, "2026-09");
  assert.equal(values.paymentDate, "2026-09-05");
  assert.equal(values.invoiceYear, "2026");
  assert.equal(values.declarantMatricule, "1234567A");
  assert.equal(values.acteDepot, "0");
});

test("buildExportRequest produces the body the export endpoint expects", () => {
  const request = buildExportRequest({
    ...initialTejFormValues("1234567a", new Date(2026, 2, 15)),
    beneficiaryName: " Prestataire Test ",
    beneficiaryMatricule: "7654321b",
    beneficiaryCategorie: "PP",
    beneficiaryAddress: "Rue de Test, Tunis",
    beneficiaryEmail: "contact@example.tn",
    beneficiaryPhone: "+21611222333",
    reference: "CERT-001",
    code: "RS7_000001",
    rate: "1.5",
    vatRate: "19",
    amountExclTax: "1000",
    amountVat: "190",
    amountInclTax: "1190",
    amountWithheld: "15",
    amountNetPaid: "1175",
  });

  assert.deepEqual(request, {
    declarant_matricule_fiscal: "1234567A",
    declarant_categorie: "PM",
    annee_depot: "2026",
    mois_depot: "03",
    acte_depot: "0",
    certificats: [
      {
        beneficiaire: {
          matricule_fiscal: "7654321B",
          categorie: "PP",
          nom_ou_raison_sociale: "Prestataire Test",
          adresse: "Rue de Test, Tunis",
          email: "contact@example.tn",
          telephone: "+21611222333",
          resident: true,
        },
        date_payement: "15/03/2026",
        reference: "CERT-001",
        operations: [
          {
            code: "RS7_000001",
            annee_facturation: "2026",
            montant_ht: 1_000_000,
            taux_rs: "1.50",
            taux_tva: "19.00",
            montant_tva: 190_000,
            montant_ttc: 1_190_000,
            montant_rs: 15_000,
            montant_net_servi: 1_175_000,
            cnpc: false,
            p_charge: false,
          },
        ],
      },
    ],
  });
});

test("buildExportRequest omits the VAT rate and amount when left blank", () => {
  const withoutVat = buildExportRequest({
    ...initialTejFormValues("1234567A", new Date(2026, 2, 15)),
    beneficiaryMatricule: "7654321B",
    reference: "CERT-001",
    code: "RS7_000001",
    rate: "1.5",
    amountExclTax: "1000",
    amountInclTax: "1000",
    amountWithheld: "15",
    amountNetPaid: "985",
  });
  const [operation] = withoutVat.certificats[0].operations;
  assert.equal("taux_tva" in operation, false);
  assert.equal("montant_tva" in operation, false);

  const amountOnly = buildExportRequest({
    ...initialTejFormValues("1234567A", new Date(2026, 2, 15)),
    amountVat: "190",
  });
  assert.equal(amountOnly.certificats[0].operations[0].montant_tva, 190_000);
  assert.equal("taux_tva" in amountOnly.certificats[0].operations[0], false);
});

const operationLoc = ["body", "certificats", 0, "operations", 0];

test("exportFieldErrors states schema, arithmetic and request errors in French on their fields", () => {
  const { fields, unplaced } = exportFieldErrors({
    detail: [
      {
        loc: ["body", "certificats", 0, "beneficiaire", "matricule_fiscal"],
        msg: "Element 'Identifiant': [facet 'pattern'] ...",
        type: "xsd.SCHEMAV_CVC_PATTERN_VALID",
      },
      { loc: ["body", "mois_depot"], msg: "...", type: "xsd.SCHEMAV_CVC_ENUMERATION_VALID" },
      { loc: [...operationLoc, "montant_ttc"], msg: "...", type: "arithmetic.ht_plus_tva" },
      { loc: [...operationLoc, "montant_ht"], msg: "Input should be a valid integer", type: "int_type" },
      { loc: ["body", "certificats", 0, "beneficiaire", "adresse"], msg: "...", type: "missing" },
    ],
  });

  assert.deepEqual(unplaced, []);
  assert.equal(
    fields.beneficiaryMatricule,
    "Le matricule fiscal doit comporter 7 chiffres suivis d’une lettre majuscule (schéma TEJ).",
  );
  assert.match(fields.period ?? "", /entre 2000 et 2099/u);
  assert.equal(fields.amountInclTax, "Le montant TTC doit être égal au montant hors taxes augmenté du montant de TVA.");
  assert.match(fields.amountExclTax ?? "", /nombre de dinars/u);
  assert.equal(fields.beneficiaryAddress, "Valeur manquante ou invalide.");
});

test("exportFieldErrors keeps a field's first error and lists errors no field matches", () => {
  const { fields, unplaced } = exportFieldErrors({
    detail: [
      { loc: [...operationLoc, "montant_ttc"], msg: "...", type: "arithmetic.ht_plus_tva" },
      { loc: [...operationLoc, "montant_ttc"], msg: "...", type: "xsd.SCHEMAV_CVC_DATATYPE_VALID_1_2_1" },
      { loc: ["body"], msg: "Element 'Operation': Missing child element(s).", type: "xsd.SCHEMAV_ELEMENT_CONTENT" },
    ],
  });

  assert.match(fields.amountInclTax ?? "", /hors taxes/u);
  assert.deepEqual(unplaced, ["Element 'Operation': Missing child element(s)."]);
  assert.deepEqual(exportFieldErrors({ detail: "document not found" }), { fields: {}, unplaced: [] });
  assert.deepEqual(exportFieldErrors(null), { fields: {}, unplaced: [] });
});

test("applyExportDraft fills only the fields the draft carries, and reports which ones", () => {
  const base = initialTejFormValues("1234567A", new Date(2026, 2, 15));
  const draft: TejExportDraft = {
    values: {
      declarant_matricule_fiscal: "1234567A",
      beneficiary_name: "Karim Jlassi",
      beneficiary_matricule_fiscal: "7654321B",
      beneficiary_address: null,
      invoice_year: "2026",
      code: null,
      rate: null,
      amount_excl_tax: "1000.0",
      amount_vat: null,
      amount_incl_tax: "1190.0",
      amount_withheld: null,
      amount_net_paid: null,
      reference: null,
    },
    derived_fields: [
      "declarant_matricule_fiscal",
      "beneficiary_name",
      "beneficiary_matricule_fiscal",
      "invoice_year",
      "amount_excl_tax",
      "amount_incl_tax",
    ],
  };

  const { values, prefilledKeys } = applyExportDraft(base, draft);

  assert.equal(values.beneficiaryName, "Karim Jlassi");
  assert.equal(values.beneficiaryMatricule, "7654321B");
  assert.equal(values.amountExclTax, "1000.0");
  assert.equal(values.amountInclTax, "1190.0");
  // Untouched: the draft carried null for these.
  assert.equal(values.beneficiaryAddress, "");
  assert.equal(values.code, "");
  assert.deepEqual(
    [...prefilledKeys].sort(),
    [
      "amountExclTax",
      "amountInclTax",
      "beneficiaryMatricule",
      "beneficiaryName",
      "declarantMatricule",
      "invoiceYear",
    ].sort(),
  );
});
