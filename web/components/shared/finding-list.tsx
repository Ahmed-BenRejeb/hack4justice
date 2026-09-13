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
      ))}
    </div>
  );
}
