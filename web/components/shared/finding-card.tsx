/** One rule outcome: the proposed code with its citation, or an abstention naming the missing fact. */
import type { JSX } from "react";
import { cn } from "cn";
import type { AnswerableFacts, Finding } from "@/lib/api-types";
import { fieldLabel } from "@/lib/labels";
import { AnswerAbstention } from "./answer-abstention";
import { Citation } from "./citation";
import { DecisionTrace } from "./decision-trace";
import { FindingStatusBadge } from "./status-badge";

interface FindingCardProps {
  finding: Finding;
  /** Set where a person may answer an abstention on the spot (J4); omitted elsewhere. */
  answering?: {
    documentId: string;
    answerable: AnswerableFacts;
    answeredBy: string;
    onAnswered: () => void;
  };
}

/** Status and rule on one line, then the code or the missing fact, then how the rule got there, then the citation. */
export function FindingCard({ finding, answering }: FindingCardProps): JSX.Element {
  const decided = finding.status === "decided";
  const titleId = `finding-${finding.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "rounded-xl border border-l-4 bg-card p-5",
        decided ? "border-l-status-decided" : "border-l-status-abstained",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FindingStatusBadge status={finding.status} />
        <span className="text-xs text-muted-foreground">
          Règle <span className="font-mono">{finding.rule_code}</span>
        </span>
      </div>

      {decided ? (
        <div className="mt-3">
          <h3 id={titleId} className="text-sm text-muted-foreground">
            Code de retenue proposé
          </h3>
          <p className="mt-1 font-mono text-2xl font-medium tracking-tight break-words">
            {finding.decided_code}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <h3 id={titleId} className="text-sm text-muted-foreground">
            Information manquante
          </h3>
          <p className="mt-1 text-base font-medium">{fieldLabel(finding.missing_fact ?? "")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun code n’est proposé tant que ce fait n’est pas établi.
          </p>
          {answering && finding.missing_fact && (
            <div className="mt-3">
              <AnswerAbstention
                documentId={answering.documentId}
                missingFact={finding.missing_fact}
                answerable={answering.answerable}
                answeredBy={answering.answeredBy}
                onAnswered={answering.onAnswered}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <DecisionTrace finding={finding} />
        <Citation citation={finding.citation} />
      </div>
    </article>
  );
}
