"use client";

/**
 * Officer review of one pre-qualified file: the evidence on the left, the summary of what is
 * already checked and the decision on the right, then the export once validated.
 */
import type { JSX } from "react";
import { ErrorNotice, LoadingBlock, StaleNotice } from "@/components/shared/api-state";
import { BackLink } from "@/components/shared/back-link";
import { CounterpartyPanel } from "@/components/shared/counterparty-panel";
import { DecisionSummary } from "@/components/shared/decision-summary";
import { ExportResult } from "@/components/shared/export-result";
import { ExtractionTable } from "@/components/shared/extraction-table";
import { FindingList } from "@/components/shared/finding-list";
import { PageHeader } from "@/components/shared/page-header";
import { PipelineProgress } from "@/components/shared/pipeline-progress";
import { Section } from "@/components/shared/section";
import { DocumentStatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, shortId } from "@/lib/format";
import { pipelineProgress } from "@/lib/pipeline";
import { useDocumentFile } from "@/lib/use-document-file";
import { DecisionPanel } from "./decision-panel";
import { ExportPanel } from "./export-panel";
import { PrequalificationSummary } from "./prequalification-summary";

/** Loads the file by id; the decision panel gives way to the decision once one exists. */
export function OfficerReview({ documentId }: { documentId: string }): JSX.Element {
  const { data, error, isLoading, reload } = useDocumentFile(documentId);

  if (isLoading) return <LoadingBlock label="Chargement du dossier" rows={4} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  const { document: detail, findings } = data;
  const decision = detail.officer_decision;

  return (
    <div className="space-y-6">
      <BackLink href="/agent">Retour à la file</BackLink>
      <PageHeader
        eyebrow={`Dossier ${shortId(detail.id)}`}
        title={detail.filename}
        meta={
          <>
            <span>Déposé le {formatDateTime(detail.uploaded_at)}</span>
            <DocumentStatusBadge status={detail.status} />
          </>
        }
      />
      {error !== undefined && <StaleNotice onRetry={reload} />}
      <PipelineProgress stages={pipelineProgress(detail, findings.length)} />

      {/* grid-cols-1 (minmax(0, 1fr)) keeps wide tables from stretching the column below lg. */}
      <div className="grid grid-cols-1 gap-8 pt-2 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-10">
          <Section id="constats" title="Constats" description="Chaque conclusion avec l’article qui la fonde.">
            <FindingList findings={findings} />
          </Section>
          <Section id="extraction" title="Informations extraites">
            <ExtractionTable extractions={detail.extractions} inProgress={findings.length === 0} />
          </Section>
          <Section id="fournisseur" title="Vérification du fournisseur">
            <CounterpartyPanel documentId={detail.id} check={detail.counterparty_check} />
          </Section>
        </div>

        <aside aria-label="Examen du dossier" className="space-y-4">
          <PrequalificationSummary document={detail} findings={findings} />
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
        </aside>
      </div>
    </div>
  );
}
