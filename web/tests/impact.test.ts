/** Unit tests for lib/impact.ts: the benefit calculation as the panel states it (J9, D-016). */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Measurement } from "../lib/api-types.ts";
import { describeCalculation, INPUT_LABELS } from "../lib/impact.ts";

function measurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    documents: 4,
    documents_analysed: 4,
    findings_decided: 6,
    findings_abstained: 2,
    errors_intercepted: 3,
    facts_confirmed_by_people: 1,
    by_rule: [],
    abstentions_by_missing_fact: [],
    inputs: [
      { name: "interventions_per_error", value: 2, basis: "estimate" },
      { name: "officer_hours_per_intervention", value: 0.5, basis: "estimate" },
    ],
    interventions_removed: 6,
    officer_hours_saved: 3,
    ...overrides,
  };
}

test("describeCalculation writes the calculation out, not just its result", () => {
  const { formula, hours } = describeCalculation(measurement());
  // The counted errors, both multiplicands and the result are all visible in the sentence.
  assert.match(formula, /^3 erreurs interceptées × 2 interventions × 0,5 h = 3 h$/u);
  assert.equal(hours, "3 heures d’agent économisées");
});

test("describeCalculation reports zero without inventing a figure", () => {
  const { formula, hours } = describeCalculation(
    measurement({ errors_intercepted: 0, interventions_removed: 0, officer_hours_saved: 0 }),
  );
  assert.match(formula, /^0 erreurs interceptées/u);
  assert.equal(hours, "0 heures d’agent économisées");
});

test("describeCalculation falls back to zero when an input is missing rather than guessing", () => {
  const { formula } = describeCalculation(measurement({ inputs: [] }));
  assert.match(formula, /× 0 interventions × 0 h/u);
});

test("every calculation input the backend reports has a French label", () => {
  for (const input of measurement().inputs) {
    assert.ok(INPUT_LABELS[input.name], `missing label for ${input.name}`);
  }
});
