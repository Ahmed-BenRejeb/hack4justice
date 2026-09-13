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
    fact: "article_52_category",
    source: "model",
    value: "honoraires",
    confidence: 0.86,
    threshold: 0.5,
  });
  assert.equal(line.value, "honoraires");
  assert.match(line.origin, /^fourni par le modèle, confiance 86\s%, seuil 50\s%$/u);
});

test("describeTraceStep says a fact the rule could not establish is not established", () => {
  const line = describeTraceStep({ fact: "article_52_category", source: "model", value: null, confidence: 0, threshold: 0.5 });
  assert.equal(line.value, "non établi");
  assert.match(line.origin, /confiance 0\s%/u);
});
