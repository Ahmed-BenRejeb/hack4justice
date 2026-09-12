/**
 * Layout shared by the MSME and officer file reviews: evidence in the main column, progress,
 * supplier check and actions in a side rail. Below lg the rail follows the main column.
 */
import type { JSX, ReactNode } from "react";

interface ReviewLayoutProps {
  header: ReactNode;
  main: ReactNode;
  rail: ReactNode;
}

/** Header across the top, then a main column and a fixed-width rail. */
export function ReviewLayout({ header, main, rail }: ReviewLayoutProps): JSX.Element {
  return (
    <div className="space-y-6">
      {header}
      {/* grid-cols-1 (minmax(0, 1fr)) keeps wide tables from stretching the column below lg. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:gap-8">
        <div className="min-w-0 space-y-8">{main}</div>
        <aside aria-label="Suivi du dossier" className="space-y-4">
          {rail}
        </aside>
      </div>
    </div>
  );
}
