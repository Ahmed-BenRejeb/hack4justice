"use client";

/** Decided against abstained, the one comparison a chart may colour by status (docs/design.md section 2). */
import type { JSX } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

interface StatusBarChartProps {
  decided: number;
  abstained: number;
  height?: number;
}

/** Two bars, each in its own status colour, never the neutral chart ramp. */
export function StatusBarChart({ decided, abstained, height = 140 }: StatusBarChartProps): JSX.Element {
  const data = [
    { label: "Décidés", value: decided, tone: "var(--status-decided)" },
    { label: "Abstentions", value: abstained, tone: "var(--status-abstained)" },
  ];

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
          <YAxis
            type="category"
            dataKey="label"
            width={100}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.tone} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
