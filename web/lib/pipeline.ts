/**
 * Derives a file's progress through the pipeline from what the backend has produced.
 *
 * Progress is read from the presence of each stage's output. The status string is used for
 * one thing only: telling a failed read apart from a read that has not happened.
 */
import type { DocumentDetail } from "./api-types";

/** The stages a file visibly moves through, in order. */
export type PipelineStage = "analysis" | "review" | "export";

/**
 * "skipped": a stage without output that the file has moved past or will never reach
 * (no export after a flag). "failed": the document could not be read.
 */
export type StageState = "done" | "current" | "pending" | "skipped" | "failed";

/** One stage and where the file stands on it. */
export interface StageProgress {
  stage: PipelineStage;
  state: StageState;
}

/** Computes the state of every stage for a document. */
export function pipelineProgress(
  document: Pick<DocumentDetail, "status" | "extractions" | "officer_decision" | "export">,
): StageProgress[] {
  const stages: [PipelineStage, boolean][] = [
    // Extraction and rule evaluation both run inside the upload request, so extracted text means both are over.
    ["analysis", document.extractions.length > 0],
    ["review", document.officer_decision !== null],
    ["export", document.export !== null],
  ];
  const lastDone = stages.findLastIndex(([, done]) => done);
  const flagged = document.officer_decision?.action === "flagged";

  return stages.map(([stage, done], index) => {
    if (done) return { stage, state: "done" };
    if (stage === "analysis" && document.status === "extraction_failed") return { stage, state: "failed" };
    if (index < lastDone || (stage === "export" && flagged)) return { stage, state: "skipped" };
    return { stage, state: index === lastDone + 1 ? "current" : "pending" };
  });
}
