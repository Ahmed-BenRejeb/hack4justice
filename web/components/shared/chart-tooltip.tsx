/** Shared tooltip for the KPI bar charts, styled from the token file rather than recharts' default. */
import type { JSX } from "react";

interface ChartTooltipDatum {
  label: string;
  value: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: ChartTooltipDatum }[];
}

export function ChartTooltip({ active, payload }: ChartTooltipProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null;
  const [{ payload: datum }] = payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{datum.label}</p>
      <p className="tabular-nums text-muted-foreground">{datum.value}</p>
    </div>
  );
}
