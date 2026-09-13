/** Title block at the top of every screen. */
import type { JSX, ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

/** Eyebrow, title, optional description and metadata line, with actions aligned to the right. */
export function PageHeader({ eyebrow, title, description, meta, actions }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl space-y-2">
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
        )}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance break-words">
          {title}
        </h1>
        {description && (
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p>
        )}
        {meta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {meta}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
