"use client";

/**
 * A single-series horizontal bar chart, coloured only from the token file (docs/design.md
 * section 2): `tone` picks a status colour when the chart reports that status, otherwise the
 * neutral chart ramp (`--chart-1`) is used. No chart in this product needs more than one series
 * at a time, so there is no legend and no per-category colour.
 */
import type { JSX } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/lib/charts";
import { ChartTooltip } from "./chart-tooltip";

const TONE_VAR = {
  neutral: "var(--chart-1)",
  decided: "var(--status-decided)",
  abstained: "var(--status-abstained)",
  flagged: "var(--status-flagged)",
} as const;

interface SimpleBarChartProps {
  data: ChartDatum[];
  tone?: keyof typeof TONE_VAR;
  /** Widened when a label is long enough to need it. */
  labelWidth?: number;
  height?: number;
}

/** One bar per datum, longest first is the caller's responsibility (the backend already orders them). */
export function SimpleBarChart({
  data,
  tone = "neutral",
  labelWidth = 140,
  height = 220,
}: SimpleBarChartProps): JSX.Element {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} className="stroke-border" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill={TONE_VAR[tone]} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
