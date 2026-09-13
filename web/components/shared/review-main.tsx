/**
 * The main column shared by the MSME and officer reviews: the result first, then the cited
 * findings, then the extracted text. A document that could not be read says so instead.
 */
import type { JSX } from "react";
import { FileXIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AnswerableFacts, DocumentDetail, Finding } from "@/lib/api-types";
import { ExtractionView } from "./extraction-view";
import { FindingList } from "./finding-list";
import { ResultBanner } from "./result-banner";
import { Section } from "./section";

interface ReviewMainProps {
  document: DocumentDetail;
  findings: Finding[];
  /** Lets an abstention be answered in place (J4). Omitted where no one may answer. */
  answering?: {
    documentId: string;
    answerable: AnswerableFacts;
    onAnswered: () => void;
  };
}

/** Result banner, findings (when any) and extracted text, or the read failure. */
export function ReviewMain({ document, findings, answering }: ReviewMainProps): JSX.Element {
  if (document.status === "extraction_failed") {
    return (
      <Alert variant="destructive">
        <FileXIcon aria-hidden />
        <AlertTitle>Lecture du document impossible</AlertTitle>
        <AlertDescription>
          Le format n’est pas pris en charge ou le document est illisible, donc aucune règle n’a été
          appliquée. Déposez de nouveau le dossier en PDF, JPEG, PNG ou TIFF.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <ResultBanner findings={findings} />
      {findings.length > 0 && (
        <Section id="constats" title="Constats" description="Ouvrez une citation pour lire l’article qui fonde le constat.">
          <FindingList findings={findings} answering={answering} />
        </Section>
      )}
      <Section id="texte" title="Texte extrait">
        <ExtractionView extractions={document.extractions} />
      </Section>
    </>
  );
}
