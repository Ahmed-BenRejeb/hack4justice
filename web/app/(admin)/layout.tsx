/** Admin screens: registry and configuration, not a compliance-decision role. */
import type { JSX, ReactNode } from "react";

/** Medium-width container. */
export default function AdminLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}
