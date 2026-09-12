/** The findings of one file, in the order the backend returns them. The tally lives in the result banner. */
import type { JSX } from "react";
import type { Finding } from "@/lib/api-types";
import { FindingCard } from "./finding-card";

/** One card per finding. */
export function FindingList({ findings }: { findings: Finding[] }): JSX.Element {
  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}
