/** Unit tests for lib/findings.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Finding, FindingStatus } from "../lib/api-types.ts";
import { groupFindings, summarizeFindings } from "../lib/findings.ts";

const citation = {
  citation_source: "Source",
  article_ref: "Article",
  verbatim_text: "Texte",
  url: "https://example.org",
};

const otherCitation = { ...citation, article_ref: "Autre article", verbatim_text: "Autre texte" };

function finding(
  id: string,
  status: FindingStatus,
  code: string | null,
  overrides: Partial<Finding> = {},
): Finding {
  return {
    id,
    rule_code: "R1",
    status,
    decided_code: code,
    missing_fact: status === "abstained" ? "Fait manquant" : null,
    trace: [],
    created_at: "2026-09-12T10:00:00Z",
    citation,
    ...overrides,
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

test("groupFindings merges rules that abstain on the same fact from the same citation", () => {
  const groups = groupFindings([
    finding("f1", "abstained", null, { rule_code: "RULE-A" }),
    finding("f2", "abstained", null, { rule_code: "RULE-B" }),
  ]);
  assert.equal(groups.length, 1);
  assert.deepEqual(
    groups[0].findings.map((f) => f.id),
    ["f1", "f2"],
  );
});

test("groupFindings keeps findings separate when the citation differs", () => {
  const groups = groupFindings([
    finding("f1", "abstained", null, { rule_code: "RULE-A" }),
    finding("f2", "abstained", null, { rule_code: "RULE-B", citation: otherCitation }),
  ]);
  assert.equal(groups.length, 2);
});

test("groupFindings keeps findings separate when the decided code differs", () => {
  const groups = groupFindings([
    finding("f1", "decided", "A", { rule_code: "RULE-A" }),
    finding("f2", "decided", "B", { rule_code: "RULE-B" }),
  ]);
  assert.equal(groups.length, 2);
});
