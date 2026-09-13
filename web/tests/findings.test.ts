/** Unit tests for lib/findings.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Finding, FindingStatus } from "../lib/api-types.ts";
import { summarizeFindings } from "../lib/findings.ts";

const citation = {
  citation_source: "Source",
  article_ref: "Article",
  verbatim_text: "Texte",
  url: "https://example.org",
};

function finding(id: string, status: FindingStatus, code: string | null): Finding {
  return {
    id,
    rule_code: "R1",
    status,
    decided_code: code,
    missing_fact: status === "abstained" ? "Fait manquant" : null,
    trace: [],
    created_at: "2026-09-12T10:00:00Z",
    citation,
  };
}

test("summarizeFindings keeps each proposed code once and counts both outcomes", () => {
  const summary = summarizeFindings([
    finding("f1", "decided", "A"),
    finding("f2", "decided", "A"),
    finding("f3", "decided", "B"),
    finding("f4", "abstained", null),
  ]);
  assert.deepEqual(summary, { codes: ["A", "B"], decided: 3, abstained: 1 });
});

test("summarizeFindings reports no code when every rule abstained", () => {
  assert.deepEqual(summarizeFindings([finding("f1", "abstained", null)]), {
    codes: [],
    decided: 0,
    abstained: 1,
  });
});
