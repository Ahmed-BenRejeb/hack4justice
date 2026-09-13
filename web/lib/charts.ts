/** Pure data shaping for the KPI charts (J9, F1): counting and labelling only, never rendering. */
import type { RuleCount } from "./api-types.ts";
import { fieldLabel } from "./labels.ts";

/** One labelled bar, already in the order the chart should show it. */
export interface ChartDatum {
  label: string;
  value: number;
}

/**
 * Errors intercepted per article; several rules can share a citation (the same reason findings
 * group onto one card, D-052), so bars are summed by `article_ref` rather than one per rule, or
 * two rules citing the same article would draw two identically labelled bars.
 */
export function errorsByRule(byRule: readonly RuleCount[]): ChartDatum[] {
  const order: string[] = [];
  const totals = new Map<string, number>();
  for (const rule of byRule) {
    if (!totals.has(rule.article_ref)) {
      totals.set(rule.article_ref, 0);
      order.push(rule.article_ref);
    }
    totals.set(rule.article_ref, totals.get(rule.article_ref)! + rule.errors_intercepted);
  }
  return order.map((label) => ({ label, value: totals.get(label)! }));
}

/**
 * Filings per day, labelled "13/09". The label is cut from the ISO date itself rather than
 * parsed into a Date, which would shift the day in any time zone west of UTC; the backend has
 * already counted the day in Tunisian time and zero-filled the window.
 */
export function filingsByDay(days: readonly { day: string; count: number }[]): ChartDatum[] {
  return days.map(({ day, count }) => ({ label: `${day.slice(8, 10)}/${day.slice(5, 7)}`, value: count }));
}

/** The facts most often missing, in the backend's own most-blocking-first order. */
export function missingFactChart(entries: readonly { fact_name: string; count: number }[]): ChartDatum[] {
  return entries.map((entry) => ({ label: fieldLabel(entry.fact_name), value: entry.count }));
}
