"use client";

/**
 * MSME review of one file: live extraction, findings with citations, the RNE check, and what
 * happens next. Single-file focus, generous spacing (docs/design.md section 4).
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

/** Loads the file by id and renders every pipeline output as it becomes available. */
export function DocumentReview({ documentId }: { documentId: string }): JSX.Element {
  const { data, error, isLoading, reload } = useDocumentFile(documentId);

  if (isLoading) return <LoadingBlock label="Chargement du dossier" rows={4} />;
  if (!data) return <ErrorNotice error={error} onRetry={reload} />;

  const { document: detail, findings } = data;

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <BackLink href="/entreprise">Déposer un autre dossier</BackLink>
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
      </div>

      <Section
        id="extraction"
        title="Informations extraites"
        description="Champs lus sur le document. Les faits assistés portent leur indice de confiance."
      >
        <ExtractionTable extractions={detail.extractions} inProgress={findings.length === 0} />
      </Section>

      <Section
        id="constats"
        title="Constats"
        description="Chaque conclusion cite l’article qui la fonde. Ouvrez la citation pour lire le texte intégral."
      >
        <FindingList findings={findings} />
      </Section>

      <Section
        id="fournisseur"
        title="Vérification du fournisseur"
        description="Faits d’enregistrement au Registre national des entreprises."
      >
        <CounterpartyPanel documentId={detail.id} check={detail.counterparty_check} onChecked={reload} />
      </Section>

      <Section id="suite" title="Suite du dossier" description="Le système pré-qualifie, un agent décide.">
        <div className="space-y-4">
          <DecisionSummary decision={detail.officer_decision} />
          {detail.export && <ExportResult result={detail.export} />}
        </div>
      </Section>
    </div>
  );
}
