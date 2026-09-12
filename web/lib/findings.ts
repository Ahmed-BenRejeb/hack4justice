/** Pure summary of a file's findings, used to state the result before any detail. */
import type { Finding } from "./api-types";

/** What a file's findings add up to. */
export interface FindingSummary {
  /** Distinct proposed codes, in the order they were first reached. */
  codes: string[];
  decided: number;
  abstained: number;
}

/** Counts decided and abstained findings and collects the distinct proposed codes. */
export function summarizeFindings(findings: readonly Finding[]): FindingSummary {
  const decided = findings.filter((finding) => finding.status === "decided");
  return {
    codes: [...new Set(decided.flatMap((finding) => (finding.decided_code ? [finding.decided_code] : [])))],
    decided: decided.length,
    abstained: findings.length - decided.length,
  };
}
