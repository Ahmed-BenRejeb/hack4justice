/**
 * One outcome shared by one or more rules: the proposed code or the missing fact, with its
 * citation. Several rules can reach the identical outcome from the same citation (a shared
 * precondition); `group` carries all of them so that case renders once, not once per rule, while
 * every rule keeps its own trace.
 */
import type { JSX } from "react";
import { cn } from "cn";
import type { AnswerableFacts } from "@/lib/api-types";
import type { FindingGroup } from "@/lib/findings";
import { fieldLabel } from "@/lib/labels";
import { AnswerAbstention } from "./answer-abstention";
import { Citation } from "./citation";
import { DecisionTrace } from "./decision-trace";
import { RelatedPassages } from "./related-passages";
import { FindingStatusBadge } from "./status-badge";

interface FindingCardProps {
  group: FindingGroup;
  /** Set where a person may answer an abstention on the spot (J4); omitted elsewhere. */
  answering?: {
    documentId: string;
    answerable: AnswerableFacts;
    answeredBy: string;
    onAnswered: () => void;
  };
}

/** Status and rule(s) on one line, then the code or the missing fact, then every contributing rule's own trace, then the citation. */
export function FindingCard({ group, answering }: FindingCardProps): JSX.Element {
  const [first, ...rest] = group.findings;
  const decided = first.status === "decided";
  const titleId = `finding-${first.id}`;
  const ruleLabel = rest.length === 0 ? "Règle" : "Règles";
  const ruleCodes = group.findings.map((finding) => finding.rule_code).join(", ");

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "rounded-xl border border-l-4 bg-card p-5",
        decided ? "border-l-status-decided" : "border-l-status-abstained",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FindingStatusBadge status={first.status} />
        <span className="text-xs text-muted-foreground">
          {ruleLabel} <span className="font-mono">{ruleCodes}</span>
        </span>
      </div>

      {decided ? (
        <div className="mt-3">
          <h3 id={titleId} className="text-sm text-muted-foreground">
            Code de retenue proposé
          </h3>
          <p className="mt-1 font-mono text-2xl font-medium tracking-tight break-words">
            {first.decided_code}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <h3 id={titleId} className="text-sm text-muted-foreground">
            Information manquante
          </h3>
          <p className="mt-1 text-base font-medium">{fieldLabel(first.missing_fact ?? "")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun code n’est proposé tant que ce fait n’est pas établi.
          </p>
          {answering && first.missing_fact && (
            <div className="mt-3">
              <AnswerAbstention
                documentId={answering.documentId}
                missingFact={first.missing_fact}
                answerable={answering.answerable}
                answeredBy={answering.answeredBy}
                onAnswered={answering.onAnswered}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {group.findings.map((finding) => (
          <DecisionTrace key={finding.id} finding={finding} />
        ))}
        <Citation citation={first.citation} />
        <RelatedPassages findingId={first.id} />
      </div>
    </article>
  );
}
