"use client";

/**
 * A single-series bar chart, coloured only from the token file (docs/design.md section 2): `tone`
 * picks a status colour when the chart reports that status, otherwise the neutral chart ramp
 * (`--chart-1`) is used. No chart in this product needs more than one series at a time, so there
 * is no legend and no per-category colour.
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

const TICK = { fontSize: 12 };

interface SimpleBarChartProps {
  data: ChartDatum[];
  tone?: keyof typeof TONE_VAR;
  /** Vertical columns, for a series over time; horizontal bars with a label column otherwise. */
  columns?: boolean;
  /** Widened when a bar label is long enough to need it. */
  labelWidth?: number;
  height?: number;
}

/** One bar per datum, in the order given (the backend already orders them). */
export function SimpleBarChart({
  data,
  tone = "neutral",
  columns = false,
  labelWidth = 140,
  height = 220,
}: SimpleBarChartProps): JSX.Element {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={columns ? "horizontal" : "vertical"}
          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
        >
          <CartesianGrid horizontal={columns} vertical={!columns} className="stroke-border" />
          {columns ? (
            <>
              <XAxis
                type="category"
                dataKey="label"
                tick={TICK}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                type="number"
                allowDecimals={false}
                width={32}
                tick={TICK}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
            </>
          ) : (
            <>
              <XAxis type="number" allowDecimals={false} tick={TICK} className="fill-muted-foreground" />
              <YAxis
                type="category"
                dataKey="label"
                width={labelWidth}
                tick={TICK}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
            </>
          )}
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar
            dataKey="value"
            fill={TONE_VAR[tone]}
            radius={columns ? [4, 4, 0, 0] : [0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
