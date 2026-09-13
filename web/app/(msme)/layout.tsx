/** MSME screens inside the space frame: one file at a time, generous spacing (docs/design.md section 4). */
import type { JSX, ReactNode } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { requireRole } from "@/lib/session";

/** Open to MSME users and accountants; wide enough for the review's main column and rail. */
export default async function MsmeLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const user = await requireRole("msme", "accountant");
  return (
    <AppShell user={user}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </AppShell>
  );
}
