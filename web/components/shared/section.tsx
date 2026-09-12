/** A titled region of a screen, labelled for assistive technology by its heading. */
import type { JSX, ReactNode } from "react";

interface SectionProps {
  /** Unique on the page; used to label the region. */
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

/** Heading, optional description and action, then content. */
export function Section({ id, title, description, action, children }: SectionProps): JSX.Element {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id={id} className="font-heading text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
