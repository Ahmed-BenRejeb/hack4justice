/** Where a file stands in the pipeline, as a four-step indicator. Uses neutral colour: progress is not a status. */
import type { JSX } from "react";
import { CircleCheckIcon, CircleDotIcon, CircleIcon, CircleMinusIcon } from "lucide-react";
import { cn } from "cn";
import type { PipelineStage, StageProgress, StageState } from "@/lib/pipeline";

const STAGE_LABELS: Record<PipelineStage, string> = {
  analysis: "Analyse du dossier",
  counterparty: "Vérification RNE",
  review: "Examen par un agent",
  export: "Export TEJ",
};

const STATE_ICONS = {
  done: CircleCheckIcon,
  current: CircleDotIcon,
  pending: CircleIcon,
  skipped: CircleMinusIcon,
} as const;

function stateLabel(stage: PipelineStage, state: StageState): string {
  if (state === "done") return "Terminé";
  if (state === "skipped") return "Non effectuée";
  if (state === "pending") return "À venir";
  return stage === "analysis" ? "En cours" : "En attente";
}

/** Renders the stages computed by `pipelineProgress`. */
export function PipelineProgress({ stages }: { stages: StageProgress[] }): JSX.Element {
  return (
    <ol aria-label="Avancement du dossier" className="grid gap-1 rounded-xl border bg-card p-1.5 sm:grid-cols-4">
      {stages.map(({ stage, state }) => {
        const Icon = STATE_ICONS[state];
        return (
          <li
            key={stage}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", state === "current" && "bg-muted")}
          >
            <Icon
              aria-hidden
              className={cn(
                "size-5 shrink-0",
                state === "done" && "text-foreground",
                state === "current" && "text-primary",
                (state === "pending" || state === "skipped") && "text-muted-foreground/60",
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm leading-tight font-medium",
                  (state === "pending" || state === "skipped") && "text-muted-foreground",
                )}
              >
                {STAGE_LABELS[stage]}
              </p>
              <p className="text-xs text-muted-foreground">{stateLabel(stage, state)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
