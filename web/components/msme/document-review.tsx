"use client";

/**
 * MSME review of one file, answer first: result, cited findings and extracted text in the main
 * column; progress, the officer's decision and the export in the rail.
 */
import type { JSX } from "react";
import { ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { DecisionSummary } from "@/components/shared/decision-summary";
import { ExportResult } from "@/components/shared/export-result";
import { FileHeader } from "@/components/shared/file-header";
import { PageGuide } from "@/components/shared/page-guide";
import { PipelineProgress } from "@/components/shared/pipeline-progress";
import { ReviewLayout } from "@/components/shared/review-layout";
import { ReviewMain } from "@/components/shared/review-main";
import { pipelineProgress } from "@/lib/pipeline";
import { useAnswerableFacts } from "@/lib/use-answerable-facts";
import { useDocumentFile } from "@/lib/use-document-file";

/** Loads the file by id and keeps it current while an officer acts on it. */
export function DocumentReview({ documentId }: { documentId: string }): JSX.Element {
  const { data, error, isLoading, reload } = useDocumentFile(documentId);
  const answerable = useAnswerableFacts(documentId);

  if (isLoading) return <LoadingBlock label="Chargement du dossier" rows={4} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  const { document: detail, findings } = data;
  // The filer answers questions about their own supplier (J4); the backend records who answered.
  const answering = answerable.data
    ? { documentId, answerable: answerable.data, onAnswered: reload }
    : undefined;

  return (
    <ReviewLayout
      header={
        <>
          <FileHeader backHref="/entreprise" backLabel="Retour au tableau de bord" document={detail} />
          {error !== undefined && <StaleNotice onRetry={reload} />}
          <PageGuide
            defaultOpen={false}
            steps={[
              "Le bandeau résume le résultat : le code proposé, les informations manquantes et le nombre de règles appliquées.",
              "Chaque constat cite l’article qui le fonde ; ouvrez la citation pour en lire le texte.",
              "Quand une question vous est posée, votre réponse relance l’analyse du dossier.",
              "La colonne de droite suit l’avancement : la décision de l’agent, puis la déclaration TEJ.",
            ]}
          />
        </>
      }
      main={<ReviewMain document={detail} findings={findings} answering={answering} />}
      rail={
        <>
          <PipelineProgress stages={pipelineProgress(detail)} />
          {detail.officer_decision && <DecisionSummary decision={detail.officer_decision} />}
          {detail.export && <ExportResult result={detail.export} />}
        </>
      }
    />
  );
}
