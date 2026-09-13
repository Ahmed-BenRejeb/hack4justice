/** Admin screens inside the space frame: registry and corpus, not a compliance-decision role. */
import type { JSX, ReactNode } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { requireRole } from "@/lib/session";

/** Open to admins; medium-width container. */
export default async function AdminLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const user = await requireRole("admin");
  return (
    <AppShell user={user}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </AppShell>
  );
}
