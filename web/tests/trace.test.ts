/** Unit tests for lib/trace.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { describeTraceStep } from "../lib/trace.ts";

const step = { confidence: null, threshold: null };

test("describeTraceStep states a document fact as yes or no", () => {
  assert.deepEqual(describeTraceStep({ ...step, fact: "withholding_mention", source: "document", value: false }), {
    label: "Mention « retenue » dans le texte",
    value: "non",
    origin: "lu dans le document",
  });
  assert.equal(describeTraceStep({ ...step, fact: "full_text", source: "document", value: true }).value, "oui");
});

test("describeTraceStep gives a model fact its confidence and the rule's threshold", () => {
  const line = describeTraceStep({
    fact: "payment_category",
    source: "model",
    value: "honoraires",
    confidence: 0.86,
    threshold: 0.5,
  });
  assert.equal(line.label, "Catégorie du paiement");
  assert.equal(line.value, "honoraires");
  assert.match(line.origin, /^fourni par le modèle, confiance 86\s%, seuil 50\s%$/u);
});

test("describeTraceStep says a fact the model could not establish was requested, not supplied", () => {
  const line = describeTraceStep({ fact: "payment_category", source: "model", value: null, confidence: null, threshold: 0.5 });
  assert.equal(line.value, "non établi");
  assert.match(line.origin, /^demandé au modèle, seuil 50\s%$/u);
});

test("describeTraceStep names the person who confirmed a fact, and when", () => {
  const line = describeTraceStep({
    ...step,
    fact: "beneficiary_fiscal_regime",
    source: "person",
    value: "reel",
    confirmed_by: "owner@example.tn",
    confirmed_at: "2026-09-13",
  });
  assert.equal(line.label, "Régime fiscal du bénéficiaire");
  assert.equal(line.value, "reel");
  assert.equal(line.origin, "confirmé par owner@example.tn le 13/09/2026");
});

test("describeTraceStep falls back to the generic person label without a name", () => {
  const line = describeTraceStep({ ...step, fact: "beneficiary_fiscal_regime", source: "person", value: "reel" });
  assert.equal(line.origin, "confirmé par une personne");
});
