"use client";

/**
 * Officer review of one pre-qualified file, answer first: the result banner states what is
 * already checked, the cited findings and extracted fields follow; the decision leads the rail,
 * then the export once validated, progress and the RNE check.
 */
import type { JSX } from "react";
import { ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { CounterpartyPanel } from "@/components/shared/counterparty-panel";
import { DecisionSummary } from "@/components/shared/decision-summary";
import { ExportResult } from "@/components/shared/export-result";
import { ExtractionTable } from "@/components/shared/extraction-table";
import { FileHeader } from "@/components/shared/file-header";
import { FindingList } from "@/components/shared/finding-list";
import { PipelineProgress } from "@/components/shared/pipeline-progress";
import { ResultBanner } from "@/components/shared/result-banner";
import { ReviewLayout } from "@/components/shared/review-layout";
import { Section } from "@/components/shared/section";
import { pipelineProgress } from "@/lib/pipeline";
import { useDocumentFile } from "@/lib/use-document-file";
import { DecisionPanel } from "./decision-panel";
import { ExportPanel } from "./export-panel";

/** Loads the file by id; the decision panel gives way to the recorded decision once one exists. */
export function OfficerReview({ documentId }: { documentId: string }): JSX.Element {
  const { data, error, isLoading, reload } = useDocumentFile(documentId);

  if (isLoading) return <LoadingBlock label="Chargement du dossier" rows={4} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  const { document: detail, findings } = data;
  const decision = detail.officer_decision;

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
          <ResultBanner findings={findings} extractions={detail.extractions} check={detail.counterparty_check} />
          <Section id="constats" title="Constats" description="Ouvrez une citation pour lire l’article qui fonde le constat.">
            <FindingList findings={findings} />
          </Section>
          <Section id="extraction" title="Informations extraites">
            <ExtractionTable extractions={detail.extractions} inProgress={findings.length === 0} />
          </Section>
        </>
      }
      rail={
        <>
          {decision ? (
            <DecisionSummary decision={decision} />
          ) : (
            <DecisionPanel documentId={detail.id} onDecided={reload} />
          )}
          {decision?.action === "validated" &&
            (detail.export ? (
              <ExportResult result={detail.export} />
            ) : (
              <ExportPanel documentId={detail.id} onExported={reload} />
            ))}
          <PipelineProgress stages={pipelineProgress(detail, findings.length)} />
          <CounterpartyPanel documentId={detail.id} check={detail.counterparty_check} />
        </>
      }
    />
  );
}
