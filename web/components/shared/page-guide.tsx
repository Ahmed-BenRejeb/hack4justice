/** "Mode d’emploi": what a screen is for, as numbered steps, directly under its title. */
import type { JSX } from "react";
import { ChevronDownIcon, InfoIcon } from "lucide-react";

interface PageGuideProps {
  steps: string[];
  /** Closed on screens that lead with an answer, so the guide never pushes it down (docs/design.md section 4). */
  defaultOpen?: boolean;
}

/** A native disclosure: keyboard-operable without script, and it opens only when the user asks. */
export function PageGuide({ steps, defaultOpen = true }: PageGuideProps): JSX.Element {
  return (
    <details open={defaultOpen} className="group rounded-xl border bg-card px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-medium [&::-webkit-details-marker]:hidden">
        <InfoIcon className="size-4 text-muted-foreground" aria-hidden />
        Mode d’emploi
        <ChevronDownIcon
          className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ol className="mt-3 grid gap-x-8 gap-y-2 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2.5 text-sm text-muted-foreground">
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground tabular-nums"
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </details>
  );
}
