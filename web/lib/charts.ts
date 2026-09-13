/** Pure data shaping for the KPI charts (J9, F1): counting and labelling only, never rendering. */
import type {
  CorpusSourceSummary,
  Finding,
  QueueItem,
  Rule,
  RuleCount,
  VerificationQueueEntry,
} from "./api-types.ts";
import { fieldLabel } from "./labels.ts";

/** One labelled bar, already in the order the chart should show it. */
export interface ChartDatum {
  label: string;
  value: number;
}

/** A decided-against-abstained split, the one comparison a chart may colour by status. */
export interface OutcomeSplit {
  decided: number;
  abstained: number;
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

/** The facts most often missing, in the backend's own most-blocking-first order. */
export function missingFactChart(entries: readonly { fact_name: string; count: number }[]): ChartDatum[] {
  return entries.map((entry) => ({ label: fieldLabel(entry.fact_name), value: entry.count }));
}

/** Counts by key, largest bar first so the chart reads top-down; ties keep first-seen order. */
function tally(keys: readonly string[]): ChartDatum[] {
  const order: string[] = [];
  const totals = new Map<string, number>();
  for (const key of keys) {
    if (!totals.has(key)) {
      totals.set(key, 0);
      order.push(key);
    }
    totals.set(key, totals.get(key)! + 1);
  }
  return order
    .map((label) => ({ label, value: totals.get(label)! }))
    .sort((a, b) => b.value - a.value);
}

/**
 * How the officer's queue splits: files where every rule reached a finding, against files still
 * holding an abstention. A file counts as abstained when it has any abstention at all, matching
 * the "Avec abstention" filter, so the chart and the tab counts never disagree.
 */
export function queueComposition(items: readonly QueueItem[]): OutcomeSplit {
  let decided = 0;
  let abstained = 0;
  for (const item of items) {
    if (item.abstained_count > 0) abstained += 1;
    else if (item.decided_count > 0) decided += 1;
  }
  return { decided, abstained };
}

/** One file's own outcomes, for the decided-against-abstained bar above its findings. */
export function findingOutcomes(findings: readonly Finding[]): OutcomeSplit {
  let decided = 0;
  let abstained = 0;
  for (const finding of findings) {
    if (finding.status === "abstained") abstained += 1;
    else decided += 1;
  }
  return { decided, abstained };
}

/** Registered rules per citing source, so the registry shows which text the engine leans on. */
export function rulesBySource(rules: readonly Rule[]): ChartDatum[] {
  return tally(rules.map((rule) => rule.citation_source));
}

/** Indexed passages per official source, largest first. */
export function corpusCoverage(sources: readonly CorpusSourceSummary[]): ChartDatum[] {
  return sources
    .map((source) => ({ label: source.title, value: source.total_passages }))
    .sort((a, b) => b.value - a.value);
}

/** Verified passages against everything indexed, the corpus's real progress figure. */
export function corpusVerified(sources: readonly CorpusSourceSummary[]): { verified: number; total: number } {
  let verified = 0;
  let total = 0;
  for (const source of sources) {
    verified += source.verified_passages;
    total += source.total_passages;
  }
  return { verified, total };
}

/** Pending verification references per source, from the queue already on screen; no extra call. */
export function verificationBySource(entries: readonly VerificationQueueEntry[]): ChartDatum[] {
  return tally(entries.map((entry) => entry.source_id));
}
