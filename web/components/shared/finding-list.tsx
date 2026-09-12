/** The findings of one file, with a tally, or a waiting state before any rule has run. */
import type { JSX } from "react";
import type { Finding } from "@/lib/api-types";
import { countLabel } from "@/lib/format";
import { FindingCard } from "./finding-card";

/** Tally line followed by one card per finding, in the order the backend returns them. */
export function FindingList({ findings }: { findings: Finding[] }): JSX.Element {
  if (findings.length === 0) {
    return (
      <div role="status" className="rounded-xl border border-dashed bg-card px-5 py-6">
        <p className="text-sm font-medium">Évaluation des règles en attente</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Les règles sont évaluées dès la fin de l’extraction. Chaque constat arrivera avec
          l’article qui le fonde.
        </p>
      </div>
    );
  }

  const decided = findings.filter((finding) => finding.status === "decided").length;
  const abstained = findings.length - decided;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {countLabel(decided, "constat décidé", "constats décidés")} ·{" "}
        {countLabel(abstained, "abstention", "abstentions")}
      </p>
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}
