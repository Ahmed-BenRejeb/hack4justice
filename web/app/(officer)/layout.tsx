/** Officer screens: wide and dense, an officer works many files (docs/design.md section 4). */
import type { JSX, ReactNode } from "react";
import { requireRole } from "@/lib/session";

/** Open to officers; wide container with tighter vertical rhythm than the MSME side. */
export default async function OfficerLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  await requireRole("officer");
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</div>;
}
