/**
 * Derives a file's progress through the pipeline from what the backend has produced.
 *
 * Progress is read from the presence of each stage's output, not from the document's
 * status string, so the view stays correct whatever status vocabulary the backend uses.
 */
import type { DocumentDetail } from "./api-types";

/** The stages a file visibly moves through, in order. */
export type PipelineStage = "analysis" | "counterparty" | "review" | "export";

/** "skipped" is a stage without output that a later stage has already moved past (the RNE check is optional). */
export type StageState = "done" | "current" | "pending" | "skipped";

/** One stage and where the file stands on it. */
export interface StageProgress {
  stage: PipelineStage;
  state: StageState;
}

/** Computes the state of every stage. `findingCount` comes from the findings endpoint. */
export function pipelineProgress(
  document: Pick<DocumentDetail, "counterparty_check" | "officer_decision" | "export">,
  findingCount: number,
): StageProgress[] {
  const stages: [PipelineStage, boolean][] = [
    // Rules run only after extraction completes, so any finding means the analysis is over.
    ["analysis", findingCount > 0],
    ["counterparty", document.counterparty_check !== null],
    ["review", document.officer_decision !== null],
    ["export", document.export !== null],
  ];
  const lastDone = stages.findLastIndex(([, done]) => done);

  return stages.map(([stage, done], index) => {
    if (done) return { stage, state: "done" };
    if (index < lastDone) return { stage, state: "skipped" };
    return { stage, state: index === lastDone + 1 ? "current" : "pending" };
  });
}
