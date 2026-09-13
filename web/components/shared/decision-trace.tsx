"use client";

/**
 * "Pourquoi ce code ?" (J1): the facts a rule used, each tagged with where it came from, then what
 * the rule decided. It makes the design law visible: the model supplies a fact, the rule decides.
 */
import type { JSX } from "react";
import { ChevronDownIcon, ListChecksIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Finding } from "@/lib/api-types";
import { fieldLabel } from "@/lib/labels";
import { describeTraceStep } from "@/lib/trace";

/** Collapsed by default so the answer stays first; absent for findings recorded without a trace. */
export function DecisionTrace({ finding }: { finding: Finding }): JSX.Element | null {
  if (finding.trace.length === 0) return null;
  const decided = finding.status === "decided";

  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/70">
        <ListChecksIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 text-sm font-medium">{decided ? "Pourquoi ce code ?" : "Pourquoi aucun code ?"}</span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ol className="space-y-3 border-t px-4 py-4 text-sm">
          {finding.trace.map((step, index) => {
            const line = describeTraceStep(step);
            return (
              <li key={index} className="flex gap-3">
                <span className="w-4 shrink-0 font-mono text-xs leading-5 text-muted-foreground">{index + 1}</span>
                <div className="min-w-0">
                  <p className="break-words">
                    <span className="text-muted-foreground">{line.label} : </span>
                    <span className="font-medium">{line.value}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{line.origin}</p>
                </div>
              </li>
            );
          })}
          <li className="flex gap-3">
            <span className="w-4 shrink-0 font-mono text-xs leading-5 text-muted-foreground">
              {finding.trace.length + 1}
            </span>
            <p className="min-w-0 break-words">
              <span className="text-muted-foreground">
                Règle <span className="font-mono">{finding.rule_code}</span> :{" "}
              </span>
              {decided ? (
                <span className="font-mono font-medium">{finding.decided_code}</span>
              ) : (
                <span className="font-medium">
                  abstention, information manquante : {fieldLabel(finding.missing_fact ?? "")}
                </span>
              )}
            </p>
          </li>
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
