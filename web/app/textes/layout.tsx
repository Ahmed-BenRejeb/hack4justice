/** Legal source screens inside the signed-in user's own space frame: search and the passage reader (J2, J10). */
import type { JSX, ReactNode } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { requireRole } from "@/lib/session";

/** Open to every signed-in role; medium-width container, matching the admin space. */
export default async function TextesLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const user = await requireRole("msme", "accountant", "officer", "admin");
  return (
    <AppShell user={user}>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </AppShell>
  );
}
