/** Where a file stands in the pipeline, as a vertical step list for the review rail. Neutral colour: progress is not a status. */
import type { JSX } from "react";
import { CircleCheckIcon, CircleDotIcon, CircleIcon, CircleMinusIcon, CircleXIcon } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStage, StageProgress, StageState } from "@/lib/pipeline";

const STAGE_LABELS: Record<PipelineStage, string> = {
  analysis: "Lecture et analyse",
  review: "Examen par un agent",
  export: "Export TEJ",
};

const STATE_ICONS = {
  done: CircleCheckIcon,
  current: CircleDotIcon,
  pending: CircleIcon,
  skipped: CircleMinusIcon,
  failed: CircleXIcon,
} as const;

const STATE_LABELS: Record<StageState, string> = {
  done: "Terminé",
  current: "En attente",
  pending: "À venir",
  skipped: "Non effectué",
  failed: "Échec",
};

/** Renders the stages computed by `pipelineProgress`, joined by a connector line. */
export function PipelineProgress({ stages }: { stages: StageProgress[] }): JSX.Element {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Avancement</CardTitle>
      </CardHeader>
      <CardContent>
        <ol aria-label="Avancement du dossier">
          {stages.map(({ stage, state }, index) => {
            const Icon = STATE_ICONS[state];
            const muted = state === "pending" || state === "skipped";
            return (
              <li
                key={stage}
                aria-current={state === "current" ? "step" : undefined}
                className="relative flex gap-3 pb-4 last:pb-0"
              >
                {index < stages.length - 1 && (
                  <span aria-hidden className="absolute top-6 bottom-1 left-2.5 w-px -translate-x-1/2 bg-border" />
                )}
                <Icon
                  aria-hidden
                  className={cn(
                    "size-5 shrink-0",
                    state === "done" && "text-foreground",
                    state === "current" && "text-primary",
                    state === "failed" && "text-destructive",
                    muted && "text-muted-foreground/60",
                  )}
                />
                <div className="min-w-0">
                  <p className={cn("text-sm leading-5 font-medium", muted && "text-muted-foreground")}>
                    {STAGE_LABELS[stage]}
                  </p>
                  <p className={cn("text-xs text-muted-foreground", state === "failed" && "text-destructive")}>
                    {STATE_LABELS[state]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
