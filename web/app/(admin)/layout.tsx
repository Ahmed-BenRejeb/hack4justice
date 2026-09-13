/** Admin screens: registry and configuration, not a compliance-decision role. */
import type { JSX, ReactNode } from "react";
import { requireRole } from "@/lib/session";

/** Open to admins; medium-width container. */
export default async function AdminLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  await requireRole("admin");
  return <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>;
}
