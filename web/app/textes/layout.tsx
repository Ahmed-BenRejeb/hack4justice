/** Legal source screens: search and the passage reader, reached from any citation (J2, J10). */
import type { JSX, ReactNode } from "react";

/** Medium-width container, matching the admin space. */
export default function TextesLayout({ children }: { children: ReactNode }): JSX.Element {
  return <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}
