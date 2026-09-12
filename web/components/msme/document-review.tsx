"use client";

/**
 * MSME review of one file, answer first: the result banner and the cited findings lead the main
 * column, extracted fields follow; progress, the RNE check and the outcome sit in the rail.
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

/** Loads the file by id and renders every pipeline output as it becomes available. */
export function DocumentReview({ documentId }: { documentId: string }): JSX.Element {
  const { data, error, isLoading, reload } = useDocumentFile(documentId);

  if (isLoading) return <LoadingBlock label="Chargement du dossier" rows={4} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  const { document: detail, findings } = data;

  return (
    <ReviewLayout
      header={
        <>
          <FileHeader backHref="/entreprise" backLabel="Déposer un autre dossier" document={detail} />
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
          <PipelineProgress stages={pipelineProgress(detail, findings.length)} />
          <CounterpartyPanel documentId={detail.id} check={detail.counterparty_check} onChecked={reload} />
          {detail.officer_decision && <DecisionSummary decision={detail.officer_decision} />}
          {detail.export && <ExportResult result={detail.export} />}
        </>
      }
    />
  );
}
