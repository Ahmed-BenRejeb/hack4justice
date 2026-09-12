/** The findings of one file, or a waiting state before any rule has run. The tally lives in the result banner. */
import type { JSX } from "react";
import type { Finding } from "@/lib/api-types";
import { FindingCard } from "./finding-card";

/** One card per finding, in the order the backend returns them. */
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

  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}
