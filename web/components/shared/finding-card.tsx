/** One rule outcome: the proposed code with its citation, or an abstention naming the missing fact. */
import type { JSX } from "react";
import { cn } from "cn";
import type { Finding } from "@/lib/api-types";
import { Citation } from "./citation";
import { FindingStatusBadge } from "./status-badge";

/** A decided finding leads with the code; an abstention leads with the fact that is missing. */
export function FindingCard({ finding }: { finding: Finding }): JSX.Element {
  const decided = finding.status === "decided";
  const titleId = `finding-${finding.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "rounded-xl border border-l-4 bg-card p-5 shadow-xs",
        decided ? "border-l-status-decided" : "border-l-status-abstained",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Règle <span className="font-mono">{finding.rule.code}</span>
          </p>
          <h3 id={titleId} className="text-base font-semibold">
            {decided ? "Code de retenue proposé" : "Le système ne tranche pas"}
          </h3>
        </div>
        <FindingStatusBadge status={finding.status} />
      </header>

      {decided ? (
        <p className="mt-4 font-mono text-3xl font-medium tracking-tight">{finding.decided_code}</p>
      ) : (
        <div className="mt-4 rounded-lg bg-status-abstained/10 px-4 py-3">
          <p className="text-xs font-medium text-status-abstained">Information manquante</p>
          <p className="mt-1 text-sm font-medium">{finding.missing_fact}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Aucun code n’est proposé tant que ce fait n’est pas établi. Plutôt que de deviner, le
            système pose la question à un humain.
          </p>
        </div>
      )}

      <div className="mt-4">
        <Citation rule={finding.rule} />
      </div>
    </article>
  );
}
