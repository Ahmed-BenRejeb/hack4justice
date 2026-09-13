/** Unit tests for lib/tej.ts: the form-to-schema conversions an export depends on. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildExportRequest,
  dinarsToMillimes,
  formatRate,
  initialTejFormValues,
  toTejDate,
} from "../lib/tej.ts";

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
    amountExclTax: "1000",
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
