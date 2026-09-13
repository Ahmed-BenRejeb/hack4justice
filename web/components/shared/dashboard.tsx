/** Building blocks shared by the dashboards and the measures page: key figures and chart cards. */
import type { JSX, ReactNode } from "react";

/** A row of key figures joined by hairlines, four to a row on wide screens. */
export function StatGrid({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <section aria-label={label} className="overflow-hidden rounded-xl border">
      <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">{children}</dl>
    </section>
  );
}

/** One key figure with its label and an optional line saying what it counts. */
export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }): JSX.Element {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** A titled card around one chart. */
export function ChartCard({ title, description, children }: ChartCardProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card px-5 py-4">
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
