/** Unit tests for lib/charts.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { RuleCount } from "../lib/api-types.ts";
import { errorsByRule, missingFactChart } from "../lib/charts.ts";

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
