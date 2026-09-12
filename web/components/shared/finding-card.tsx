/** One rule outcome: the proposed code with its citation, or an abstention naming the missing fact. */
import type { JSX } from "react";
import { cn } from "cn";
import type { Finding } from "@/lib/api-types";
import { Citation } from "./citation";
import { FindingStatusBadge } from "./status-badge";

/** Status and rule on one line, then the code or the missing fact, then the citation. */
export function FindingCard({ finding }: { finding: Finding }): JSX.Element {
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
          <p className="mt-1 text-base font-medium">{finding.missing_fact}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aucun code n’est proposé tant que ce fait n’est pas établi.
          </p>
        </div>
      )}

      <div className="mt-4">
        <Citation citation={finding.citation} />
      </div>
    </article>
  );
}
