/** Unit tests for the pure lib/ modules. Run with `pnpm test` (Node test runner, native type stripping). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { errorDetail } from "../lib/api-client.ts";
import type { OfficerDecision, QueueItem } from "../lib/api-types.ts";
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

test("errorDetail reads FastAPI string and validation-list details", () => {
  assert.equal(errorDetail({ detail: "Document not validated" }), "Document not validated");
  assert.equal(
    errorDetail({ detail: [{ msg: "field required" }, { msg: "invalid type" }] }),
    "field required; invalid type",
  );
  assert.equal(errorDetail({ detail: [] }), null);
  assert.equal(errorDetail({ message: "other shape" }), null);
  assert.equal(errorDetail(null), null);
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
  assert.equal(fieldLabel("supplier_tax_id"), "Matricule fiscal du fournisseur");
  assert.equal(fieldLabel("contract_ref"), "Contract ref");
  assert.equal(fieldLabel("constructor"), "Constructor");
  assert.equal(documentStatusLabel("validated"), "Validé");
});

test("pipelineProgress reads stage outputs and marks passed-over stages as skipped", () => {
  const empty = { counterparty_check: null, officer_decision: null, export: null };
  const decision: OfficerDecision = {
    id: "d1",
    officer_id: "o1",
    action: "validated",
    note: null,
    decided_at: "2026-09-12T10:00:00Z",
  };
  const states = (document: typeof empty | { officer_decision: OfficerDecision }, findings: number) =>
    pipelineProgress({ ...empty, ...document }, findings).map((stage) => stage.state);

  assert.deepEqual(states(empty, 0), ["current", "pending", "pending", "pending"]);
  assert.deepEqual(states(empty, 2), ["done", "current", "pending", "pending"]);
  assert.deepEqual(states({ officer_decision: decision }, 2), ["done", "skipped", "done", "current"]);
});

test("newArrivals ignores the first load and reports only new ids", () => {
  assert.equal(newArrivals(null, ["a", "b"]).size, 0);
  assert.deepEqual([...newArrivals(new Set(["a"]), ["a", "b", "c"])], ["b", "c"]);
});

test("filterQueue separates files with abstentions from fully decided ones", () => {
  const item = (id: string, decided: number, abstained: number): QueueItem => ({
    document_id: id,
    filename: `${id}.pdf`,
    organisation_name: "Organisation",
    submitted_at: "2026-09-12T10:00:00Z",
    status: "prequalified",
    decided_count: decided,
    abstained_count: abstained,
    counterparty_registered: null,
  });
  const items = [item("a", 2, 0), item("b", 1, 1), item("c", 0, 0)];
  const ids = (list: QueueItem[]) => list.map((entry) => entry.document_id);

  assert.deepEqual(ids(filterQueue(items, "abstained")), ["b"]);
  assert.deepEqual(ids(filterQueue(items, "decided")), ["a"]);
  assert.equal(filterQueue(items, "all").length, 3);
});
