/** Unit tests for lib/charts.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  CorpusSourceSummary,
  Finding,
  QueueItem,
  Rule,
  RuleCount,
  VerificationQueueEntry,
} from "../lib/api-types.ts";
import {
  corpusCoverage,
  corpusVerified,
  errorsByRule,
  filingsByDay,
  findingOutcomes,
  missingFactChart,
  queueComposition,
  rulesBySource,
  verificationBySource,
} from "../lib/charts.ts";

function rule(overrides: Partial<RuleCount> = {}): RuleCount {
  return {
    rule_code: "R1",
    article_ref: "Article 1",
    decided: 0,
    abstained: 0,
    errors_intercepted: 0,
    ...overrides,
  };
}

function queueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "d1",
    organisation_id: "o1",
    organisation_name: "Org",
    uploaded_by: "someone",
    filename: "f.pdf",
    status: "extracted",
    created_at: "2026-09-13T10:00:00Z",
    decided_count: 0,
    abstained_count: 0,
    missing_facts: [],
    ...overrides,
  };
}

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "f1",
    rule_code: "R1",
    status: "decided",
    decided_code: "RS2",
    missing_fact: null,
    trace: [],
    created_at: "2026-09-13T10:00:00Z",
    citation: { citation_source: "Code", article_ref: "Article 1", verbatim_text: "…", url: "https://x" },
    ...overrides,
  };
}

function registryRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "r1",
    code: "R1",
    logic_ref: "rules.a",
    citation_source: "Code de l’IRPP",
    article_ref: "Article 52",
    verbatim_text: "…",
    url: "https://x",
    ...overrides,
  };
}

function source(overrides: Partial<CorpusSourceSummary> = {}): CorpusSourceSummary {
  return {
    id: "s1",
    title: "Code de l’IRPP",
    edition: "2026",
    publisher: "DGI",
    url: "https://x",
    sha256: "abc",
    language: "fr",
    page_count: 100,
    loaded_at: "2026-09-13T10:00:00Z",
    verified_passages: 0,
    total_passages: 0,
    citing_rules: [],
    ...overrides,
  };
}

function queueEntry(overrides: Partial<VerificationQueueEntry> = {}): VerificationQueueEntry {
  return {
    id: "c1",
    source_id: "s1",
    article_ref: "Article 52",
    paragraph_ref: "I",
    page: 12,
    official_url: "https://x",
    ...overrides,
  };
}

test("errorsByRule labels each bar by article and keeps rules with zero errors", () => {
  assert.deepEqual(
    errorsByRule([
      rule({ article_ref: "Article 52, I, a)", errors_intercepted: 3 }),
      rule({ article_ref: "Article 55, I", errors_intercepted: 0 }),
    ]),
    [
      { label: "Article 52, I, a)", value: 3 },
      { label: "Article 55, I", value: 0 },
    ],
  );
});

test("errorsByRule sums rules that cite the same article into one bar", () => {
  assert.deepEqual(
    errorsByRule([
      rule({ rule_code: "R1", article_ref: "Article 52, I, a)", errors_intercepted: 2 }),
      rule({ rule_code: "R2", article_ref: "Article 52, I, a)", errors_intercepted: 3 }),
      rule({ rule_code: "R3", article_ref: "Article 55, I", errors_intercepted: 1 }),
    ]),
    [
      { label: "Article 52, I, a)", value: 5 },
      { label: "Article 55, I", value: 1 },
    ],
  );
});

test("filingsByDay labels each day day/month from the ISO date and keeps zero days", () => {
  assert.deepEqual(
    filingsByDay([
      { day: "2026-08-31", count: 0 },
      { day: "2026-09-01", count: 3 },
    ]),
    [
      { label: "31/08", value: 0 },
      { label: "01/09", value: 3 },
    ],
  );
});

test("missingFactChart uses the French field label and keeps the backend's order", () => {
  assert.deepEqual(
    missingFactChart([
      { fact_name: "payment_category", count: 4 },
      { fact_name: "some_unmapped_fact", count: 1 },
    ]),
    [
      { label: "Catégorie du paiement", value: 4 },
      { label: "Some unmapped fact", value: 1 },
    ],
  );
});

test("queueComposition counts a file with any abstention as abstained, matching the filter tabs", () => {
  assert.deepEqual(
    queueComposition([
      queueItem({ id: "a", decided_count: 3, abstained_count: 0 }),
      queueItem({ id: "b", decided_count: 2, abstained_count: 1 }),
      queueItem({ id: "c", decided_count: 0, abstained_count: 2 }),
    ]),
    { decided: 1, abstained: 2 },
  );
});

test("queueComposition ignores a file no rule has evaluated yet", () => {
  assert.deepEqual(
    queueComposition([queueItem({ decided_count: 0, abstained_count: 0 })]),
    { decided: 0, abstained: 0 },
  );
});

test("findingOutcomes splits one file's findings by status", () => {
  assert.deepEqual(
    findingOutcomes([
      finding({ id: "a", status: "decided" }),
      finding({ id: "b", status: "abstained", decided_code: null, missing_fact: "payment_category" }),
      finding({ id: "c", status: "decided" }),
    ]),
    { decided: 2, abstained: 1 },
  );
});

test("rulesBySource counts rules per citing source, largest first", () => {
  assert.deepEqual(
    rulesBySource([
      registryRule({ id: "1", citation_source: "Code de l’IRPP" }),
      registryRule({ id: "2", citation_source: "Code des droits" }),
      registryRule({ id: "3", citation_source: "Code de l’IRPP" }),
    ]),
    [
      { label: "Code de l’IRPP", value: 2 },
      { label: "Code des droits", value: 1 },
    ],
  );
});

test("corpusCoverage labels each source by title and orders by indexed passages", () => {
  assert.deepEqual(
    corpusCoverage([
      source({ id: "a", title: "Petit texte", total_passages: 12 }),
      source({ id: "b", title: "Grand texte", total_passages: 66 }),
    ]),
    [
      { label: "Grand texte", value: 66 },
      { label: "Petit texte", value: 12 },
    ],
  );
});

test("corpusVerified totals verified against indexed across every source", () => {
  assert.deepEqual(
    corpusVerified([
      source({ id: "a", verified_passages: 1, total_passages: 66 }),
      source({ id: "b", verified_passages: 0, total_passages: 12 }),
    ]),
    { verified: 1, total: 78 },
  );
});

test("verificationBySource counts pending references per source, largest first", () => {
  assert.deepEqual(
    verificationBySource([
      queueEntry({ id: "1", source_id: "irpp" }),
      queueEntry({ id: "2", source_id: "tva" }),
      queueEntry({ id: "3", source_id: "irpp" }),
      queueEntry({ id: "4", source_id: "irpp" }),
    ]),
    [
      { label: "irpp", value: 3 },
      { label: "tva", value: 1 },
    ],
  );
});
