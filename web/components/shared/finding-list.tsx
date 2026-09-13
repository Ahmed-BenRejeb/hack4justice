/**
 * The findings of one file, in the order the backend returns them. The tally lives in the result
 * banner. Distinct rules that reach the same outcome from the same citation are grouped onto one
 * card (see `groupFindings`), so a shared precondition never reads as a duplicated constat.
 */
import type { JSX } from "react";
import type { Finding } from "@/lib/api-types";
import { groupFindings } from "@/lib/findings";
import { FindingCard } from "./finding-card";

/** One card per distinct outcome. */
export function FindingList({ findings }: { findings: Finding[] }): JSX.Element {
  return (
    <div className="space-y-3">
      {groupFindings(findings).map((group) => (
        <FindingCard key={group.findings.map((finding) => finding.id).join("+")} group={group} />
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
