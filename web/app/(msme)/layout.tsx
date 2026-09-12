/** MSME screens: one file at a time, generous spacing (docs/design.md section 4). */
import type { JSX, ReactNode } from "react";

/** Wide enough for the review's main column and rail; the upload page narrows itself. */
export default function MsmeLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}
