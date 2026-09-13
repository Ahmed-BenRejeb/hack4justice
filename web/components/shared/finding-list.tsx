/** The findings of one file, in the order the backend returns them. The tally lives in the result banner. */
import type { JSX } from "react";
import type { AnswerableFacts, Finding } from "@/lib/api-types";
import { FindingCard } from "./finding-card";

interface FindingListProps {
  findings: Finding[];
  /** Passed through to each abstention so it can be answered on the spot (J4). */
  answering?: {
    documentId: string;
    answerable: AnswerableFacts;
    answeredBy: string;
    onAnswered: () => void;
  };
}

/** One card per finding. */
export function FindingList({ findings, answering }: FindingListProps): JSX.Element {
  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} answering={answering} />
      ))}
    </div>
  );
}
