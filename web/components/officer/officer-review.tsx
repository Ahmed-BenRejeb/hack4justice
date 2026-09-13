"use client";

/**
 * Officer review of one file, answer first. Once the file is validated, the TEJ export form
 * leads the main column; the decision, the export result and progress sit in the rail.
 */
import type { JSX } from "react";
import { ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { DecisionSummary } from "@/components/shared/decision-summary";
import { ExportResult } from "@/components/shared/export-result";
import { FileHeader } from "@/components/shared/file-header";
import { PipelineProgress } from "@/components/shared/pipeline-progress";
import { ReviewLayout } from "@/components/shared/review-layout";
import { ReviewMain } from "@/components/shared/review-main";
import { pipelineProgress } from "@/lib/pipeline";
import { useAnswerableFacts } from "@/lib/use-answerable-facts";
import { useDocumentFile } from "@/lib/use-document-file";
import { DecisionPanel } from "./decision-panel";
import { ExportForm } from "./export-form";

interface OfficerReviewProps {
  documentId: string;
  /** Recorded on the decision; comes from server configuration until officer sign-in exists. */
  officerId: string;
}

/** Loads the file by id; the decision panel gives way to the recorded decision once one exists. */
export function OfficerReview({ documentId, officerId }: OfficerReviewProps): JSX.Element {
  const { data, error, isLoading, reload } = useDocumentFile(documentId);
  const answerable = useAnswerableFacts(documentId);

  if (isLoading) return <LoadingBlock label="Chargement du dossier" rows={4} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  const { document: detail, findings } = data;
  const decision = detail.officer_decision;
  const awaitingExport = decision?.action === "validated" && detail.export === null;
  // An officer resolves what is missing before validating; once decided, the file is settled.
  const answering =
    answerable.data && !decision
      ? { documentId, answerable: answerable.data, answeredBy: officerId, onAnswered: reload }
      : undefined;

  return (
    <ReviewLayout
      header={
        <>
          <FileHeader backHref="/agent" backLabel="Retour à la file" document={detail} />
          {error !== undefined && <StaleNotice onRetry={reload} />}
        </>
      }
      main={
        <>
          {awaitingExport && <ExportForm document={detail} onExported={reload} />}
          <ReviewMain document={detail} findings={findings} answering={answering} />
        </>
      }
      rail={
        <>
          {decision ? (
            <DecisionSummary decision={decision} />
          ) : (
            <DecisionPanel documentId={detail.id} officerId={officerId} onDecided={reload} />
          )}
          {detail.export && <ExportResult result={detail.export} />}
          <PipelineProgress stages={pipelineProgress(detail)} />
        </>
      }
    />
  );
}
