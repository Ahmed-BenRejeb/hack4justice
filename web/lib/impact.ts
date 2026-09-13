/**
 * French reading of the measurement (J9) and of the D-016 benefit calculation.
 *
 * The calculation is written out rather than reduced to its result: the brief asks for an hours
 * figure, and the figure is only defensible beside the counts and the labelled inputs it comes
 * from (docs/plan.md section 7).
 */
import type { Measurement } from "./api-types.ts";

/** French names for the calculation's multiplicands, keyed by the backend's input names. */
export const INPUT_LABELS: Record<string, string> = {
  interventions_per_error: "Interventions évitées par erreur",
  officer_hours_per_intervention: "Heures d’agent par intervention",
};

/** The calculation as a sentence, and its result. */
export interface Calculation {
  formula: string;
  hours: string;
}

function number(value: number): string {
  return new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 1 }).format(value);
}

/** "3 erreurs x 2 interventions x 0,5 h = 3 h", with the inputs the backend reported. */
export function describeCalculation(measurement: Measurement): Calculation {
  const byName = new Map(measurement.inputs.map((input) => [input.name, input.value]));
  const perError = byName.get("interventions_per_error") ?? 0;
  const perIntervention = byName.get("officer_hours_per_intervention") ?? 0;

  const formula = `${measurement.errors_intercepted} erreurs interceptées × ${number(perError)} interventions × ${number(perIntervention)} h = ${number(measurement.officer_hours_saved)} h`;
  return {
    formula,
    hours: `${number(measurement.officer_hours_saved)} heures d’agent économisées`,
  };
}
