/** Unit tests for the pure lib/ modules. Run with `pnpm test` (Node test runner, native type stripping). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { errorMessages } from "../lib/api-client.ts";
import type { OfficerDecision, QueueItem, TejExport } from "../lib/api-types.ts";
import {
  countLabel,
  foldText,
  formatConfidence,
  formatDateTime,
  formatFileSize,
  httpUrl,
  shortId,
} from "../lib/format.ts";
import { documentStatusLabel, fieldLabel } from "../lib/labels.ts";
import { pipelineProgress } from "../lib/pipeline.ts";
import { filterQueue, newArrivals, queueMissingFacts, withMissingFact } from "../lib/queue.ts";

test("errorMessages reads string, validation-list and plain-list details", () => {
  assert.deepEqual(errorMessages({ detail: "document not found" }), ["document not found"]);
  assert.deepEqual(errorMessages({ detail: [{ msg: "field required" }, { msg: "invalid type" }] }), [
    "field required",
    "invalid type",
  ]);
  assert.deepEqual(errorMessages({ detail: ["Element 'Identifiant': not accepted.", "second"] }), [
    "Element 'Identifiant': not accepted.",
    "second",
  ]);
  assert.deepEqual(errorMessages({ detail: [] }), []);
  assert.deepEqual(errorMessages({ message: "other shape" }), []);
  assert.deepEqual(errorMessages(null), []);
});

test("formatting follows French conventions in Tunisian local time", () => {
  assert.match(formatConfidence(0.934), /^93\s%$/u);
  const formatted = formatDateTime("2026-09-12T13:32:00Z");
  assert.ok(formatted.includes("2026") && formatted.includes("14:32"), formatted);
  assert.equal(formatDateTime("not a date"), "not a date");
  assert.equal(formatFileSize(512), "512 o");
  assert.match(formatFileSize(1536), /^1,5\sKo$/u);
  assert.equal(shortId("3f2a9c1e-0000-4000-8000-000000000000"), "3F2A9C1E");
  assert.equal(countLabel(0, "règle", "règles"), "0 règle");
  assert.equal(countLabel(2, "règle", "règles"), "2 règles");
  assert.equal(foldText("Régime Fiscal"), "regime fiscal");
});

test("httpUrl only lets absolute http(s) links through", () => {
  assert.equal(httpUrl("https://example.org/texte"), "https://example.org/texte");
  assert.equal(httpUrl("javascript:alert(1)"), null);
  assert.equal(httpUrl("/relative/path"), null);
});

test("labels fall back to a readable identifier, including prototype property names", () => {
  assert.equal(fieldLabel("full_text"), "Texte intégral du document");
  assert.equal(fieldLabel("contract_ref"), "Contract ref");
  assert.equal(fieldLabel("constructor"), "Constructor");
  assert.equal(documentStatusLabel("extraction_failed"), "Lecture impossible");
});

test("pipelineProgress reads stage outputs, failures and flags", () => {
  const extraction = { id: "x1", field_name: "full_text", value: "texte", confidence: 1, source: "extracted" as const };
  const decision = (action: OfficerDecision["action"]): OfficerDecision => ({
    id: "d1",
    document_id: "doc",
    officer_id: "o1",
    action,
    note: null,
    decided_at: "2026-09-12T10:00:00Z",
  });
  const exported: TejExport = {
    id: "e1",
    document_id: "doc",
    xml_ref: "decl.xml",
    xsd_validated: true,
    validated_at: "2026-09-12T10:05:00Z",
  };
  const base = { status: "extracted", extractions: [extraction], officer_decision: null, export: null };
  const states = (document: Parameters<typeof pipelineProgress>[0]) =>
    pipelineProgress(document).map((stage) => stage.state);

  assert.deepEqual(states(base), ["done", "current", "pending"]);
  assert.deepEqual(states({ ...base, status: "extraction_failed", extractions: [] }), ["failed", "pending", "pending"]);
  assert.deepEqual(states({ ...base, officer_decision: decision("validated") }), ["done", "done", "current"]);
  assert.deepEqual(states({ ...base, officer_decision: decision("flagged") }), ["done", "done", "skipped"]);
  assert.deepEqual(states({ ...base, officer_decision: decision("validated"), export: exported }), [
    "done",
    "done",
    "done",
  ]);
});

test("newArrivals ignores the first load and reports only new ids", () => {
  assert.equal(newArrivals(null, ["a", "b"]).size, 0);
  assert.deepEqual([...newArrivals(new Set(["a"]), ["a", "b", "c"])], ["b", "c"]);
});

const queueItem = (id: string, decided: number, missingFacts: string[] = []): QueueItem => ({
  id,
  organisation_id: "org",
  organisation_name: "Organisation",
  uploaded_by: "comptable@example.tn",
  filename: `${id}.pdf`,
  status: "extracted",
  created_at: "2026-09-12T10:00:00Z",
  decided_count: decided,
  abstained_count: missingFacts.length,
  missing_facts: missingFacts,
});
const queueIds = (list: QueueItem[]) => list.map((entry) => entry.id);

test("filterQueue separates files with abstentions from fully decided ones", () => {
  const items = [queueItem("a", 2), queueItem("b", 1, ["status"]), queueItem("c", 0)];

  assert.deepEqual(queueIds(filterQueue(items, "abstained")), ["b"]);
  assert.deepEqual(queueIds(filterQueue(items, "decided")), ["a"]);
  assert.equal(filterQueue(items, "all").length, 3);
});

test("queueMissingFacts lists each missing fact once and withMissingFact keeps the files naming it", () => {
  const items = [
    queueItem("a", 0, ["beneficiary_fiscal_regime", "article_52_category"]),
    queueItem("b", 1, ["article_52_category"]),
    queueItem("c", 2),
  ];

  assert.deepEqual(queueMissingFacts(items), ["article_52_category", "beneficiary_fiscal_regime"]);
  assert.deepEqual(queueIds(withMissingFact(items, "article_52_category")), ["a", "b"]);
  assert.deepEqual(queueIds(withMissingFact(items, "beneficiary_fiscal_regime")), ["a"]);
  assert.equal(withMissingFact(items, "").length, 3);
});
