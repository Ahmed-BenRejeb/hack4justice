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
import { filterQueue, newArrivals } from "../lib/queue.ts";

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

test("filterQueue separates files with abstentions from fully decided ones", () => {
  const item = (id: string, decided: number, abstained: number): QueueItem => ({
    id,
    organisation_id: "org",
    organisation_name: "Organisation",
    uploaded_by: "comptable@example.tn",
    filename: `${id}.pdf`,
    status: "extracted",
    created_at: "2026-09-12T10:00:00Z",
    decided_count: decided,
    abstained_count: abstained,
  });
  const items = [item("a", 2, 0), item("b", 1, 1), item("c", 0, 0)];
  const ids = (list: QueueItem[]) => list.map((entry) => entry.id);

  assert.deepEqual(ids(filterQueue(items, "abstained")), ["b"]);
  assert.deepEqual(ids(filterQueue(items, "decided")), ["a"]);
  assert.equal(filterQueue(items, "all").length, 3);
});
