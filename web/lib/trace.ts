/** French reading of a rule's decision trace (J1): each fact's value, and where it came from. */
import type { TraceSource, TraceStep } from "./api-types.ts";
import { formatConfidence } from "./format.ts";
import { fieldLabel } from "./labels.ts";

const SOURCE_LABELS: Record<TraceSource, string> = {
  document: "lu dans le document",
  model: "fourni par le modèle",
};

/** One trace step as the interface states it. */
export interface TraceLine {
  label: string;
  value: string;
  /** The source, then the model's confidence and the rule's threshold when they apply. */
  origin: string;
}

/** States a step's fact, value and origin, e.g. "fourni par le modèle, confiance 86 %, seuil 50 %". */
export function describeTraceStep(step: TraceStep): TraceLine {
  let value: string;
  if (step.value === null) value = "non établi";
  else if (typeof step.value === "boolean") value = step.value ? "oui" : "non";
  else value = step.value;

  const origin = [SOURCE_LABELS[step.source]];
  if (step.confidence !== null) origin.push(`confiance ${formatConfidence(step.confidence)}`);
  if (step.threshold !== null) origin.push(`seuil ${formatConfidence(step.threshold)}`);

  return { label: fieldLabel(step.fact), value, origin: origin.join(", ") };
}
