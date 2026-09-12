/** MSME screens: one file at a time, generous spacing (docs/design.md section 4). */
import type { JSX, ReactNode } from "react";

/** Narrow centered column. */
export default function MsmeLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>;
}
